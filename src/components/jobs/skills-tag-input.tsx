"use client"

import { useState, KeyboardEvent, ClipboardEvent } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SkillsTagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  error?: string
}

export function SkillsTagInput({
  value = [],
  onChange,
  placeholder = "Type skill and press Enter or comma...",
  error,
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addTags = (tagsToAdd: string[]) => {
    const cleaned = tagsToAdd
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !value.includes(t))

    if (cleaned.length > 0) {
      onChange([...value, ...cleaned])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (inputValue.trim()) {
        addTags([inputValue])
        setInputValue("")
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    if (pastedText) {
      const splitTags = pastedText.split(/[,;\n]+/)
      addTags(splitTags)
      setInputValue("")
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  const handleAddButtonClick = () => {
    if (inputValue.trim()) {
      addTags([inputValue])
      setInputValue("")
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex min-h-[48px] flex-wrap items-center gap-2 rounded-lg border bg-white p-2.5 transition-colors focus-within:ring-2 focus-within:ring-slate-950 focus-within:ring-offset-2 ${
          error ? "border-red-500 bg-red-50/20" : "border-slate-200"
        }`}
      >
        {value.map((skill, index) => (
          <Badge
            key={`${skill}-${index}`}
            variant="secondary"
            className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="rounded-full p-0.5 text-slate-500 hover:bg-slate-300 hover:text-slate-900 focus:outline-none"
              aria-label={`Remove skill ${skill}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}

        <div className="flex flex-1 items-center min-w-[180px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={value.length === 0 ? placeholder : "Add another skill..."}
            className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-400"
          />
          {inputValue.trim() ? (
            <button
              type="button"
              onClick={handleAddButtonClick}
              className="mr-1 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title="Add skill"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> or{" "}
        <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">,</kbd> to add tags. You can also paste comma-separated values.
      </p>

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
