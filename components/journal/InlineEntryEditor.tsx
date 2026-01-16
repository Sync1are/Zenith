import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Paperclip, Pin, Sparkles } from 'lucide-react';
import { JournalEntry } from '../../types';
import { MOODS } from './constants';

interface InlineEntryEditorProps {
    isOpen: boolean;
    topicId: string;
    topicColor: string;
    onClose: () => void;
    onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const InlineEntryEditor: React.FC<InlineEntryEditorProps> = ({
    isOpen, topicId, topicColor, onClose, onSave
}) => {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<number | undefined>();
    const [pinned, setPinned] = useState(false);
    const [attachments, setAttachments] = useState<{ id: string; url: string; name: string; type: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when opened
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setMood(undefined);
            setPinned(false);
            setAttachments([]);
        }
    }, [isOpen]);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('application/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const url = e.target?.result as string;
                    setAttachments(prev => [...prev, {
                        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        url,
                        name: file.name,
                        type: file.type
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = () => {
        if (!content.trim()) return;

        onSave({
            topicId,
            date: new Date().toISOString().split('T')[0],
            content: content.trim(),
            plainText: content.trim(),
            mood,
            pinned,
            attachments: attachments.map(a => ({
                id: a.id,
                entryId: '',
                fileUrl: a.url,
                fileName: a.name,
                fileType: a.type.startsWith('image/') ? 'image' : a.type.startsWith('audio/') ? 'audio' : 'document',
                createdAt: new Date().toISOString()
            }))
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Cmd/Ctrl + Enter to save
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
        // Escape to cancel
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="overflow-hidden"
                >
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ delay: 0.05 }}
                        className="relative rounded-2xl border overflow-hidden"
                        style={{
                            borderColor: `${topicColor}30`,
                            background: `linear-gradient(135deg, ${topicColor}08 0%, transparent 50%)`
                        }}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Drag overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 bg-indigo-500/20 border-2 border-dashed border-indigo-500 rounded-2xl z-10 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <Image className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">Drop images here</p>
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: topicColor }}
                                />
                                <span className="text-sm font-medium text-white">New Entry</span>
                                <span className="text-xs text-white/40">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-4">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What's on your mind today?"
                                rows={4}
                                className="w-full bg-transparent border-none text-white placeholder:text-white/30 
                                           focus:outline-none resize-none text-base leading-relaxed"
                            />

                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                                    {attachments.map(attachment => (
                                        <div
                                            key={attachment.id}
                                            className="relative group w-16 h-16 rounded-lg overflow-hidden border border-white/10"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(attachment.id)}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                                                           transition-opacity flex items-center justify-center"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                {/* Mood Selector Compact */}
                                <div className="flex items-center gap-1">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setMood(mood === m.value ? undefined : m.value)}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm
                                                       transition-all ${mood === m.value
                                                    ? 'ring-2 ring-offset-1 ring-offset-[#111215] scale-110'
                                                    : 'opacity-40 hover:opacity-100'}`}
                                            style={{
                                                backgroundColor: `${m.color}20`,
                                                ...(mood === m.value ? { boxShadow: `0 0 0 2px ${m.color}` } : {})
                                            }}
                                            title={m.label}
                                        >
                                            {m.emoji}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-px h-6 bg-white/10" />

                                {/* Attach */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                    title="Add image"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,audio/*,application/pdf"
                                    multiple
                                    onChange={(e) => handleFileSelect(e.target.files)}
                                    className="hidden"
                                />

                                {/* Pin */}
                                <button
                                    type="button"
                                    onClick={() => setPinned(!pinned)}
                                    className={`p-2 rounded-lg transition-all ${pinned
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                                    title="Pin entry"
                                >
                                    <Pin className={`w-4 h-4 ${pinned ? 'fill-amber-400' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/30 hidden sm:block">⌘+Enter to save</span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!content.trim()}
                                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 
                                               text-white text-sm font-medium transition-colors 
                                               disabled:opacity-40 disabled:cursor-not-allowed
                                               flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InlineEntryEditor;
