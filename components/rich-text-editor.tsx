"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Smile,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const newText = value.substring(0, start) + emoji + value.substring(start)
    onChange(newText)
    setShowEmojiPicker(false)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const insertImage = () => {
    if (imageUrl.trim()) {
      insertText(`![Image](${imageUrl})`)
      setImageUrl("")
      setShowImageUpload(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create a blob URL for the uploaded file
      const blobUrl = URL.createObjectURL(file)
      insertText(`![${file.name}](${blobUrl})`)
    }
  }

  const emojis = [
    "😀",
    "😂",
    "😍",
    "🤔",
    "👍",
    "👎",
    "❤️",
    "🔥",
    "💯",
    "🎉",
    "🚀",
    "⭐",
    "✅",
    "❌",
    "⚠️",
    "💡",
    "🎯",
    "📝",
    "🔧",
    "🎨",
  ]

  return (
    <div className="border rounded-lg">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        {/* Text Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertText("*", "*")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertText("~~", "~~")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button type="button" variant="ghost" size="sm" onClick={() => insertText("\n1. ")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertText("\n- ")} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Emoji Picker */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert Emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white border rounded-lg shadow-lg z-10 w-64">
              <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded text-lg"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowImageUpload(!showImageUpload)}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          {showImageUpload && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white border rounded-lg shadow-lg z-10 w-80">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Image URL</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={insertImage} disabled={!imageUrl.trim()}>
                      Insert
                    </Button>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">or</div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('<div style="text-align: left;">', "</div>")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('<div style="text-align: center;">', "</div>")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('<div style="text-align: right;">', "</div>")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] border-0 resize-none focus-visible:ring-0"
      />

      {/* Preview area for formatted text */}
      {value && (
        <div className="border-t p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Preview:</div>
          <div
            className="prose max-w-none text-sm"
            dangerouslySetInnerHTML={{
              __html: value
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/~~(.*?)~~/g, "<del>$1</del>")
                .replace(/!\[(.*?)\]$$(.*?)$$/g, '<img src="$2" alt="$1" class="max-w-full h-auto" />')
                .replace(/\n/g, "<br>"),
            }}
          />
        </div>
      )}
    </div>
  )
}
