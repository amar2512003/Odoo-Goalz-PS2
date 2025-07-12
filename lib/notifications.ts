import { supabase } from "./supabase"

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedQuestionId,
  relatedAnswerId,
  relatedUserId,
}: {
  userId: string
  type: "answer" | "mention" | "vote"
  title: string
  message: string
  relatedQuestionId?: string
  relatedAnswerId?: string
  relatedUserId?: string
}) {
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        title,
        message,
        related_question_id: relatedQuestionId,
        related_answer_id: relatedAnswerId,
        related_user_id: relatedUserId,
      },
    ])

    if (error) throw error
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) throw error
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId)

    if (error) throw error
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
  }
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // Remove duplicates
}
