import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image, Paperclip, Pin } from 'lucide-react';
import { JournalEntry, JournalTopic } from '../../types';
import MoodSelector from './MoodSelector';

interface EntryEditorProps {
    isOpen: boolean;
    entry?: JournalEntry;
    topicId: string | null;
    topics: JournalTopic[];
    onClose: () => void;
    onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const EntryEditorModal: React.FC<EntryEditorProps> = ({
    isOpen, entry, topicId, topics, onClose, onSave
}) => {
    const [selectedTopicId, setSelectedTopicId] = useState(topicId || entry?.topicId || '');
    const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
    const [content, setContent] = useState(entry?.content || '');
    const [mood, setMood] = useState<number | undefined>(entry?.mood);
    const [pinned, setPinned] = useState(entry?.pinned || false);
    const [attachments, setAttachments] = useState<{ id: string; url: string; name: string; type: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (entry) {
            setSelectedTopicId(entry.topicId);
            setDate(entry.date);
            setContent(entry.content);
            setMood(entry.mood);
            setPinned(entry.pinned);
            // Load existing attachments if any
            setAttachments(entry.attachments?.map(a => ({
                id: a.id,
                url: a.fileUrl,
                name: a.fileName,
                type: a.fileType
            })) || []);
        } else {
            setSelectedTopicId(topicId || topics[0]?.id || '');
            setDate(new Date().toISOString().split('T')[0]);
            setContent('');
            setMood(undefined);
            setPinned(false);
            setAttachments([]);
        }
    }, [entry, topicId, isOpen, topics]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !selectedTopicId) return;

        onSave({
            topicId: selectedTopicId,
            date,
            content: content.trim(),
            plainText: content.replace(/<[^>]*>/g, '').trim(),
            mood,
            pinned,
            attachments: attachments.map(a => ({
                id: a.id,
                entryId: entry?.id || '',
                fileUrl: a.url,
                fileName: a.name,
                fileType: a.type.startsWith('image/') ? 'image' : a.type.startsWith('audio/') ? 'audio' : 'document',
                createdAt: new Date().toISOString()
            }))
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-indigo-500/20 border-2 border-dashed border-indigo-500 rounded-2xl z-10 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <Image className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                            <p className="text-white font-medium">Drop images here</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {entry ? 'Edit Entry' : 'New Entry'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Topic & Date Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm text-white/50 mb-2">Topic</label>
                            <select
                                value={selectedTopicId}
                                onChange={(e) => setSelectedTopicId(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                           text-white focus:outline-none focus:border-indigo-500/50 
                                           transition-colors appearance-none cursor-pointer"
                            >
                                {topics.map(t => (
                                    <option key={t.id} value={t.id} className="bg-[#1a1b23]">
                                        {t.icon} {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-44">
                            <label className="block text-sm text-white/50 mb-2">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                           text-white focus:outline-none focus:border-indigo-500/50 
                                           transition-colors"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm text-white/50 mb-2">What's on your mind?</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your thoughts here..."
                            rows={8}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                       text-white placeholder:text-white/30 focus:outline-none 
                                       focus:border-indigo-500/50 transition-colors resize-none"
                            autoFocus
                        />
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div>
                            <label className="block text-sm text-white/50 mb-2">Attachments</label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map(attachment => (
                                    <div
                                        key={attachment.id}
                                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10"
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
                                            <X className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mood & Attach Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MoodSelector value={mood} onChange={setMood} />
                            {/* Add attachment button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 
                                           text-white/50 hover:bg-white/5 hover:text-white transition-all"
                                title="Add image"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm hidden sm:inline">Attach</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setPinned(!pinned)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                                       ${pinned
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                    : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                        >
                            <Pin className={`w-4 h-4 ${pinned ? 'fill-amber-400' : ''}`} />
                            <span className="text-sm">Pin</span>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 
                                       hover:bg-white/5 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!content.trim() || !selectedTopicId}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 
                                       text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {entry ? 'Save Changes' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default EntryEditorModal;
