import { Elysia, t } from "elysia";
import db from "../db/db";
import { Filename, Jobs } from "../db/types";

// 使用默认用户 ID (不需要认证)
const DEFAULT_USER_ID = 1;

export const apiProgress = new Elysia({ prefix: "/api" })
  .get(
    "/progress/:jobId",
    async ({ params, set }) => {
      try {
        const { jobId } = params;

        // Get job information
        const job = db
          .query("SELECT * FROM jobs WHERE id = ? AND user_id = ?")
          .as(Jobs)
          .get(jobId, DEFAULT_USER_ID);

        if (!job) {
          set.status = 404;
          return {
            success: false,
            error: "Job not found",
          };
        }

        // Get file details
        const files = db
          .query("SELECT * FROM file_names WHERE job_id = ?")
          .as(Filename)
          .all(jobId);

        const totalFiles = job.num_files;
        const completedFiles = files.filter((f) => f.status === "completed").length;
        const failedFiles = files.filter((f) => f.status === "failed").length;
        const processingFiles = files.filter((f) => f.status === "processing").length;
        const pendingFiles = totalFiles - completedFiles - failedFiles - processingFiles;

        const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

        set.status = 200;
        return {
          success: true,
          jobId: jobId,
          status: job.status,
          progress: Math.round(progress * 100) / 100,
          totalFiles: totalFiles,
          completedFiles: completedFiles,
          failedFiles: failedFiles,
          processingFiles: processingFiles,
          pendingFiles: pendingFiles,
          dateCreated: job.date_created,
          files: files.map((f) => ({
            fileName: f.file_name,
            outputFileName: f.output_file_name,
            status: f.status,
          })),
        };
      } catch (error) {
        console.error("Progress API error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to get progress",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
    }
  );
