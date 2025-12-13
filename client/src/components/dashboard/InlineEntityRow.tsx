import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface InlineEntityRowProps<T> {
    entity: T;
    onSave: (data: Partial<T>) => Promise<void>;
    onDelete?: () => Promise<void>;
    isNew?: boolean;
    className?: string;
}

export function InlineEntityRow<T extends { id?: number; name: string; balance: number | string; type: string }>({
    entity,
    onSave,
    onDelete,
    isNew = false,
    className,
}: InlineEntityRowProps<T>) {
    const [isEditing, setIsEditing] = useState(isNew);
    const [isProcessing, setIsProcessing] = useState(false);

    // Local state for the form draft
    const [draft, setDraft] = useState<Partial<T>>({
        name: entity.name,
        balance: entity.balance,
        type: entity.type,
    } as Partial<T>);

    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && isNew) {
            nameInputRef.current?.focus();
        }
    }, [isEditing, isNew]);

    // Reset draft when entity changes externally
    useEffect(() => {
        if (!isEditing) {
            setDraft({
                name: entity.name,
                balance: entity.balance,
                type: entity.type,
            } as Partial<T>);
        }
    }, [entity, isEditing]);

    const handleSave = async () => {
        if (!draft.name || draft.name.trim() === "") {
            toast.error("Name is required");
            return;
        }

        try {
            setIsProcessing(true);
            await onSave({
                ...draft,
                balance: Number(draft.balance), // Ensure number
            } as Partial<T>);
            setIsEditing(false);

            // If it was a new row, we expect the parent to unmount us or reset state, 
            // but for editing existing rows:
            if (!isNew) {
                toast.success("Saved");
            }
        } catch (error) {
            console.error("Failed to save", error);
            toast.error("Failed to save");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        if (isNew && onDelete) {
            onDelete(); // Remove the "ghost" row
        } else {
            setIsEditing(false);
            setDraft({  // Revert
                name: entity.name,
                balance: entity.balance,
                type: entity.type,
            } as Partial<T>);
        }
    };

    if (isEditing) {
        return (
            <div className={cn("grid grid-cols-12 gap-2 items-center p-2 bg-white border rounded shadow-sm animate-in fade-in zoom-in-95", className)}>
                {/* Name Input */}
                <div className="col-span-4">
                    <Input
                        ref={nameInputRef}
                        value={draft.name as string}
                        onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Name (e.g. My Savings)"
                        className="h-8"
                        disabled={isProcessing}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                        }}
                    />
                </div>

                {/* Type Input (Simplified as text for now, could be Select if passed enum options) */}
                <div className="col-span-3">
                    <Input
                        value={draft.type as string}
                        onChange={(e) => setDraft(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="Type" // In real usage, pass in a Select component or options
                        className="h-8"
                        disabled={isProcessing}
                    />
                </div>

                {/* Balance Input */}
                <div className="col-span-3">
                    <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                        <Input
                            type="number"
                            value={draft.balance as string | number}
                            onChange={(e) => setDraft(prev => ({ ...prev, balance: e.target.value }))}
                            className="h-8 pl-6 text-right"
                            placeholder="0.00"
                            disabled={isProcessing}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                            }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleSave}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={handleCancel}
                        disabled={isProcessing}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("grid grid-cols-12 gap-2 items-center p-2 hover:bg-gray-50 rounded group cursor-pointer border border-transparent hover:border-gray-200 transition-colors", className)}
            onClick={() => setIsEditing(true)}
        >
            <div className="col-span-4 font-medium text-sm truncate">{entity.name}</div>
            <div className="col-span-3 text-sm text-gray-500 truncate">{entity.type}</div>
            <div className="col-span-3 text-sm text-right font-mono text-gray-700">
                ${Number(entity.balance).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <div className="col-span-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
                {onDelete && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure?")) onDelete();
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}
