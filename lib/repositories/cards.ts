import { createClient } from "@/lib/supabase/server";
import type { Card, CardInsert, BankName } from "@/types";

/**
 * Fetch all non-deleted cards for the current user.
 */
export async function getUserCards(userId: string): Promise<Card[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch cards: ${error.message}`);
  }

  return (data ?? []) as Card[];
}

/**
 * Fetch a single card by ID, verifying ownership.
 */
export async function getCardById(
  cardId: string,
  userId: string
): Promise<Card | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to fetch card: ${error.message}`);
  }

  return data as Card;
}

/**
 * Create a new card for the user.
 * Returns the created card with its generated ID.
 */
export async function createCard(
  userId: string,
  bankName: BankName,
  cardName: string,
  cardLastFour?: string
): Promise<Card> {
  const supabase = await createClient();

  const insert: CardInsert = {
    user_id: userId,
    bank_name: bankName,
    card_name: cardName,
    card_last_four: cardLastFour ?? null,
    card_type: "credit",
    deleted_at: null,
  };

  const { data, error } = await supabase
    .from("cards")
    .insert(insert as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create card: ${error.message}`);
  }

  return data as Card;
}
