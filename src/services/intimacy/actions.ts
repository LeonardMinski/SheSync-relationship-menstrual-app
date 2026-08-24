"use server";

import { auth } from "@/services/auth/index";
import {
  upsertBoundary,
  deleteBoundary,
} from "@/services/intimacy/boundaries";
import {
  upsertSession,
  shareSession,
} from "@/services/intimacy/sessions";
import {
  UpdateBoundaryActionSchema,
  ChooseTodayCardActionSchema,
  ToggleShareActionSchema,
} from "@/schemas/intimacy";
import { getTodayDate } from "@/features/intimacy/intimacy.selectors";

// =====================================================
// BOUNDARY ACTIONS
// =====================================================

export async function updateBoundary(formData: FormData) {
  try {
    // Get current user
    const { user } = await auth.getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Parse and validate form data
    const rawData = {
      id: (formData.get("id") as string) || undefined,
      label: formData.get("label") as string,
      status: formData.get("status") as string,
    };

    const validatedData = UpdateBoundaryActionSchema.parse(rawData);

    // Upsert boundary
    const result = await upsertBoundary(user.id, validatedData);

    if (!result) {
      return { success: false, error: "Failed to save boundary" };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating boundary:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Invalid form data" };
    }

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteBoundaryAction(formData: FormData) {
  try {
    // Get current user
    const { user } = await auth.getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const boundaryId = formData.get("id") as string;
    if (!boundaryId) {
      return { success: false, error: "Boundary ID is required" };
    }

    const success = await deleteBoundary(user.id, boundaryId);

    if (!success) {
      return { success: false, error: "Failed to delete boundary" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting boundary:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =====================================================
// SESSION ACTIONS
// =====================================================

export async function chooseTodayCard(formData: FormData) {
  try {
    // Get current user
    const { user } = await auth.getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Parse and validate form data
    const rawData = {
      selectedCardId: formData.get("selectedCardId") as string,
      reflection: (formData.get("reflection") as string) || undefined,
    };

    const validatedData = ChooseTodayCardActionSchema.parse(rawData);

    // Create session data
    const sessionData = {
      date: getTodayDate(),
      selectedCardId: validatedData.selectedCardId,
      reflection: validatedData.reflection,
    };

    const result = await upsertSession(user.id, sessionData);

    if (!result) {
      return { success: false, error: "Failed to save session" };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error choosing today card:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Invalid form data" };
    }

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function toggleShare(formData: FormData) {
  try {
    // Get current user
    const { user } = await auth.getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Parse and validate form data
    const rawData = {
      date: formData.get("date") as string,
      shared: formData.get("shared") === "true",
    };

    const validatedData = ToggleShareActionSchema.parse(rawData);

    const success = await shareSession(
      user.id,
      validatedData.date,
      validatedData.shared,
    );

    if (!success) {
      return { success: false, error: "Failed to update share status" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling share:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Invalid form data" };
    }

    return { success: false, error: "An unexpected error occurred" };
  }
}

// =====================================================
// REFLECTION ACTIONS
// =====================================================

export async function updateReflection(formData: FormData) {
  try {
    // Get current user
    const { user } = await auth.getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const date = formData.get("date") as string;
    const reflection = formData.get("reflection") as string;

    if (!date) {
      return { success: false, error: "Date is required" };
    }

    // Update the session with new reflection
    const sessionData = {
      date,
      selectedCardId: "", // This will be ignored in the upsert
      reflection: reflection || undefined,
    };

    const result = await upsertSession(user.id, sessionData);

    if (!result) {
      return { success: false, error: "Failed to update reflection" };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating reflection:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
