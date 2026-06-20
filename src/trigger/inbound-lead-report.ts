import { task, logger } from "@trigger.dev/sdk/v3";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { google } from "googleapis";
import { Readable } from "stream";
import Groq from "groq-sdk";

const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatbotPayload {
  service: string;
  problem: string;
  timeline: string;
  name: string;
  email: string;
  score: string;
  timestamp: string;
}

interface Finding {
  title: string;
  content: string;
}

function validatePayload(p: unknown): p is ChatbotPayload {
  if (!p || typeof p !== "object") return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.name === "string" && obj.name.trim() !== "" &&
    typeof obj.email === "string" && obj.email.trim() !== "" &&
    typeof obj.service === "string" && obj.service.trim() !== "" &&
    typeof obj.problem === "string" && obj.problem.trim() !== "" &&
    typeof obj.timeline === "string" && obj.timeline.trim() !== ""
  );
}

async function expandFindings(groq: Groq, payload: ChatbotPayload, rawFindings: Finding[]): Promise<Finding[]> {
  logger.info("Groq findings expansion started", {
    model: GROQ_MODEL,
    clientName: payload.name,
    service: payload.service,
  });

  const systemPrompt = `You are a professional business consultant writing structured client reports.
Return ONLY valid JSON — an array of objects with "title" and "content" keys. No markdown, no preamble.`;

  const userPrompt = `Write a full consulting report for the following inbound lead.

Client: ${payload.name}
Service Requested: ${payload.service}
Timeline: ${payload.timeline}
Lead Score: ${payload.score}

Problem they described:
${payload.problem}

Produce exactly these 5 sections as a JSON array:
1. Executive Summary — 2-3 sentences summarising who this lead is and what they need
2. Problem Analysis — detailed breakdown of the problem they described
3. Recommended Services — specific automation or AI services that would solve their problem
4. Proposed Action Plan — step-by-step next steps for engaging this client in the next 30/60/90 days
5. Expected Outcomes — measurable results the client can expect

Each section "content" should be 2-4 full paragraphs of professional prose.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in Groq response");

    const sections = JSON.parse(jsonMatch[0]) as Finding[];
    logger.info("Groq findings expansion complete", {
      model: GROQ_MODEL,
      sectionCount: sections.length,
      clientName: payload.name,
    });
    return sections;
  } catch (error) {
    logger.warn("Groq expansion failed, falling back to raw inputs", {
      model: GROQ_MODEL,
      clientName: payload.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return rawFindings;
  }
}

async function buildDocument(
  clientName: string,
  projectTitle: string,
  date: string,
  findings: Finding[]
): Promise<Buffer> {
  logger.info("Building .docx document", { clientName, projectTitle, sectionCount: findings.length });

  try {
    const children: Paragraph[] = [
      new Paragraph({
        text: projectTitle,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Client: ", bold: true }),
          new TextRun(clientName),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Date: ", bold: true }),
          new TextRun(date),
        ],
      }),
      new Paragraph({ text: "" }),
      ...findings.flatMap((f) => [
        new Paragraph({ text: f.title, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: f.content }),
        new Paragraph({ text: "" }),
      ]),
    ];

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const buffer = await Packer.toBuffer(doc);
    logger.info(".docx document built", { sizeBytes: buffer.length });
    return buffer;
  } catch (error) {
    logger.error("Failed to build .docx document", {
      clientName,
      projectTitle,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

async function uploadToDrive(buffer: Buffer, fileName: string): Promise<{ fileId: string; webViewLink: string }> {
  logger.info("Google Drive upload started", { fileName, sizeBytes: buffer.length });

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ...(folderId ? { parents: [folderId] } : {}),
      },
      media: {
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        body: Readable.from(buffer),
      },
      fields: "id,webViewLink",
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    if (!fileId || !webViewLink) {
      throw new Error(
        `Drive upload returned incomplete metadata: fileId=${fileId}, webViewLink=${webViewLink}`
      );
    }

    logger.info("Google Drive upload complete", { fileName, fileId, webViewLink });
    return { fileId, webViewLink };
  } catch (error) {
    logger.error("Google Drive upload failed", {
      fileName,
      sizeBytes: buffer.length,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export const inboundLeadReport = task({
  id: "inbound-lead-report",
  maxDuration: 300,
  retry: {
    maxAttempts: 4,
    minTimeoutInMs: 30_000,
    maxTimeoutInMs: 240_000,
    factor: 2,
    randomize: true,
  },
  run: async (payload: unknown) => {
    logger.info("Inbound lead report run started");

    if (!validatePayload(payload)) {
      logger.error("Invalid payload received", { payload });
      return { success: false, reason: "invalid-payload" };
    }

    logger.info("Payload validated", {
      name: payload.name,
      email: payload.email,
      service: payload.service,
      score: payload.score,
    });

    const date = (payload.timestamp ?? new Date().toISOString()).split("T")[0];
    const projectTitle = `${payload.name} - ${payload.service} Consultation`;

    const rawFindings: Finding[] = [
      { title: "Service Requested", content: payload.service },
      { title: "Problem Statement", content: payload.problem },
      { title: "Timeline", content: payload.timeline },
      {
        title: "Lead Score & Contact",
        content: `Priority: ${payload.score}. Email: ${payload.email}`,
      },
    ];

    logger.info("Step 1/3: Expanding findings with Groq", { model: GROQ_MODEL });
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const expandedFindings = await expandFindings(groq, payload, rawFindings);
    logger.info("Findings expanded", { sectionCount: expandedFindings.length });

    logger.info("Step 2/3: Building .docx document");
    const buffer = await buildDocument(payload.name, projectTitle, date, expandedFindings);

    const slug = (s: string) => s.replace(/\s+/g, "_").replace(/[^\w_-]/g, "");
    const fileName = `${slug(payload.name)}_${slug(payload.service)}_${date}.docx`;

    logger.info("Step 3/3: Uploading to Google Drive", { fileName });
    const uploaded = await uploadToDrive(buffer, fileName);

    logger.info("Inbound lead report run complete", {
      clientName: payload.name,
      fileName,
      fileId: uploaded.fileId,
      webViewLink: uploaded.webViewLink,
      score: payload.score,
    });

    return {
      success: true,
      fileId: uploaded.fileId,
      webViewLink: uploaded.webViewLink,
      fileName,
      clientName: payload.name,
      score: payload.score,
    };
  },
});
