import React, { useState } from 'react';
import { Check, ChevronsUpDown, Info } from 'lucide-react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetGlobalWatchListsQuery } from '@/api/watchlistService';
import { WatchList } from '@/types/common-types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GlobalWatchListsSelectProps {
  onSelect: (watchlist: WatchList | null) => void;
  onAssetSelect?: (watchlist: WatchList, assetId: number) => void;
}

export const GlobalWatchListsSelect: React.FC<GlobalWatchListsSelectProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const { data: globalLists, isLoading, error } = useGetGlobalWatchListsQuery({});

  const watchlists = (globalLists?.results || []) as WatchList[];

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setOpen(false);
    const selected = watchlists.find(w => w.id.toString() === selectedValue);
    onSelect(selected || null);
  };

  // If no global lists exist, show info alert
  if (!isLoading && (!watchlists || watchlists.length === 0)) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No global watchlists available. Contact an administrator to create general watchlists.
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading skeleton or error state
  if (isLoading || error) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        {isLoading ? "Loading lists..." : "Error loading lists"}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? watchlists.find((list) => list.id.toString() === value)?.name
            : "Select a global watchlist..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search lists..." />
          <CommandList>
            <CommandEmpty>No watchlists found.</CommandEmpty>
            <CommandGroup>
              {watchlists.map((list) => (
                <CommandItem
                  key={list.id}
                  value={list.id.toString()}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === list.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{list.name}</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {list.asset_count} assets
                      </Badge>
                    </div>
                    {list.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {list.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};