"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { Card, BankName } from "@/types";

const SUPPORTED_BANKS: BankName[] = ["SBI", "RBL", "HDFC", "ICICI", "Axis", "IDFC", "Other"];

interface CardSelectorProps {
  existingCards: Card[];
  onCardChange: (cardId: string | null) => void;
  onNewCardChange: (data: {
    bankName: BankName | null;
    cardName: string;
    cardLastFour: string;
  }) => void;
}

export function CardSelector({
  existingCards,
  onCardChange,
  onNewCardChange,
}: CardSelectorProps) {
  const [mode, setMode] = useState<"existing" | "new">(
    existingCards.length > 0 ? "existing" : "new"
  );
  const [selectedCardId, setSelectedCardId] = useState<string>(
    existingCards[0]?.id ?? ""
  );
  const [bankName, setBankName] = useState<BankName>("SBI");
  const [cardName, setCardName] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");

  function handleModeChange(newMode: "existing" | "new") {
    setMode(newMode);
    if (newMode === "existing") {
      onCardChange(selectedCardId || null);
      onNewCardChange({ bankName: null, cardName: "", cardLastFour: "" });
    } else {
      onCardChange(null);
      onNewCardChange({ bankName, cardName, cardLastFour });
    }
  }

  function handleExistingCardChange(id: string) {
    setSelectedCardId(id);
    onCardChange(id);
  }

  function handleBankChange(bank: BankName) {
    setBankName(bank);
    onNewCardChange({ bankName: bank, cardName, cardLastFour });
  }

  function handleCardNameChange(name: string) {
    setCardName(name);
    onNewCardChange({ bankName, cardName: name, cardLastFour });
  }

  function handleLastFourChange(val: string) {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    setCardLastFour(cleaned);
    onNewCardChange({ bankName, cardName, cardLastFour: cleaned });
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      {existingCards.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("existing")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
              mode === "existing"
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            Existing card
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("new")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
              mode === "new"
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <PlusCircle size={14} />
              New card
            </span>
          </button>
        </div>
      )}

      {/* Existing card select */}
      {mode === "existing" && existingCards.length > 0 && (
        <Select
          id="existing_card"
          label="Select card"
          value={selectedCardId}
          onChange={(e) => handleExistingCardChange(e.target.value)}
        >
          {existingCards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.bank_name} — {card.card_name}
              {card.card_last_four ? ` ••••${card.card_last_four}` : ""}
            </option>
          ))}
        </Select>
      )}

      {/* New card fields */}
      {mode === "new" && (
        <div className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            New card details
          </p>

          <Select
            id="bank_name"
            label="Bank"
            value={bankName}
            onChange={(e) => handleBankChange(e.target.value as BankName)}
          >
            {SUPPORTED_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>

          <Input
            id="card_name"
            label="Card name"
            placeholder="e.g. SimplySAVE, Duet Card"
            value={cardName}
            onChange={(e) => handleCardNameChange(e.target.value)}
          />

          <Input
            id="card_last_four"
            label="Last 4 digits (optional)"
            placeholder="1234"
            value={cardLastFour}
            onChange={(e) => handleLastFourChange(e.target.value)}
            maxLength={4}
            inputMode="numeric"
          />
        </div>
      )}
    </div>
  );
}
