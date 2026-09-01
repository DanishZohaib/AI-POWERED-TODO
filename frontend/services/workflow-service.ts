import { api } from "@/lib/api-client";
import { Task } from "@/types";

export interface StageCompletePayload {
  comments?: string;
}

export const workflowService = {
  /**
   * Mark a workflow stage as completed.
   * Auto-completes task if stage is a completion stage.
   */
  async completeStage(taskId: string, stageId: string, payload: StageCompletePayload): Promise<Task> {
    return api.post<Task>(`/tasks/${taskId}/stages/${stageId}/complete`, payload);
  },

  /**
   * Mark a workflow stage as uncompleted.
   */
  async uncompleteStage(taskId: string, stageId: string): Promise<Task> {
    return api.post<Task>(`/tasks/${taskId}/stages/${stageId}/uncomplete`, {});
  },
};
