// client/src/components/CuisineTagSelector.tsx
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, Plus, X } from "lucide-react";
import { CUISINE_OPTIONS, type CuisineType, getCuisineLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CuisineTagSelectorProps {
  selectedCuisines: string[];
  onCuisinesChange: (cuisines: string[]) => void;
  placeholder?: string;
  className?: string;
}

const CuisineTagSelector: React.FC<CuisineTagSelectorProps> = ({
  selectedCuisines,
  onCuisinesChange,
  placeholder = "Seleziona tipi di cucina...",
  className
}) => {
  const [open, setOpen] = useState(false);

  const addCuisine = (cuisine: string) => {
    if (!selectedCuisines.includes(cuisine)) {
      onCuisinesChange([...selectedCuisines, cuisine]);
    }
    setOpen(false);
  };

  const removeCuisine = (cuisine: string) => {
    onCuisinesChange(selectedCuisines.filter(c => c !== cuisine));
  };

  const getCuisineColor = (cuisine: string) => {
    const colors: Record<string, string> = {
      pugliese: "bg-[hsl(var(--forest-green))]/10 text-[hsl(var(--forest-green))] border-[hsl(var(--forest-green))]/20",
      italiana: "bg-[hsl(var(--olive-drab))]/10 text-[hsl(var(--olive-drab))] border-[hsl(var(--olive-drab))]/20",
      pesce: "bg-blue-100 text-blue-700 border-blue-200",
      barbecue: "bg-red-100 text-red-700 border-red-200",
      steakhouse: "bg-gray-100 text-gray-700 border-gray-200",
      mediterranea: "bg-[hsl(var(--olive-drab))]/10 text-[hsl(var(--olive-drab))] border-[hsl(var(--olive-drab))]/20",
    };
    return colors[cuisine] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const availableCuisines = CUISINE_OPTIONS.filter(
    option => !selectedCuisines.includes(option.value)
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Cuisines Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedCuisines.map((cuisine) => (
          <Badge
            key={cuisine}
            variant="outline"
            className={cn(
              "px-3 py-1 text-sm font-medium border cursor-pointer hover:opacity-80 transition-opacity",
              getCuisineColor(cuisine)
            )}
            onClick={() => removeCuisine(cuisine)}
          >
            {getCuisineLabel(cuisine)}
            <X className="w-3 h-3 ml-2" />
          </Badge>
        ))}
      </div>

      {/* Add Cuisine Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-start text-left font-normal"
            disabled={availableCuisines.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            {availableCuisines.length === 0 
              ? "Tutti i tipi di cucina selezionati" 
              : placeholder
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Cerca tipo di cucina..." />
            <CommandEmpty>Nessun tipo di cucina trovato.</CommandEmpty>
            <CommandGroup>
              {availableCuisines.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => addCuisine(option.value)}
                  className="cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-2 opacity-0" />
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    getCuisineColor(option.value)
                  )}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCuisines.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Seleziona almeno un tipo di cucina
        </p>
      )}
    </div>
  );
};

export default CuisineTagSelector;