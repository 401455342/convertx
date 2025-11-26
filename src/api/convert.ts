import { mkdir } from "node:fs/promises";
import { Elysia, t } from "elysia";
import sanitize from "sanitize-filename";
import { outputDir, uploadsDir } from "..";
import { handleConvert } from "../converters/main";
import db from "../db/db";
import { Jobs } from "../db/types";
import { normalizeFiletype } from "../helpers/normalizeFiletype";

// 使用默认用户 ID (不需要认证)
const DEFAULT_USER_ID = 1;

export const apiConvert = new Elysia({ prefix: "/api" })
  .post(
    "/convert/:jobId",
    async ({ params, body, set }) => {
      try {
        const { jobId } = params;

        // Check if job exists and belongs to user
        const existingJob = db
          .query("SELECT * FROM jobs WHERE id = ? AND user_id = ?")
          .as(Jobs)
          .get(jobId, DEFAULT_USER_ID);

        if (!existingJob) {
          set.status = 404;
          return {
            success: false,
            error: "Job not found",
          };
        }

        const userUploadsDir = `${uploadsDir}${DEFAULT_USER_ID}/${jobId}/`;
        const userOutputDir = `${outputDir}${DEFAULT_USER_ID}/${jobId}/`;

        // Create output directory
        await mkdir(userOutputDir, { recursive: true });

        // Parse conversion parameters
        const convertTo = normalizeFiletype(body.convertTo);
        const converterName = body.converter;

        if (!converterName) {
          set.status = 400;
          return {
            success: false,
            error: "Converter name is required",
          };
        }

        // Sanitize file names
        const fileNames = body.fileNames.map((name) => sanitize(name));

        if (!Array.isArray(fileNames) || fileNames.length === 0) {
          set.status = 400;
          return {
            success: false,
            error: "File names array is required and must not be empty",
          };
        }

        // Update job status
        db.query("UPDATE jobs SET num_files = ?1, status = 'pending' WHERE id = ?2").run(
          fileNames.length,
          jobId
        );

        // Create a simple cookie-like object for handleConvert
        const jobIdCookie = {
          value: String(jobId),
          name: 'jobId',
        } as any;

        // Start conversion process in background
        handleConvert(
          fileNames,
          userUploadsDir,
          userOutputDir,
          convertTo,
          converterName,
          jobIdCookie
        )
          .then(() => {
            db.query("UPDATE jobs SET status = 'completed' WHERE id = ?1").run(jobId);
          })
          .catch((error) => {
            console.error("Conversion error:", error);
            db.query("UPDATE jobs SET status = 'failed' WHERE id = ?1").run(jobId);
          });

        set.status = 200;
        return {
          success: true,
          jobId: jobId,
          status: "pending",
          message: "Conversion started",
          filesCount: fileNames.length,
        };
      } catch (error) {
        console.error("Convert API error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to start conversion",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
      body: t.Object({
        convertTo: t.String(),
        converter: t.String(),
        fileNames: t.Array(t.String()),
      }),
    }
  );
