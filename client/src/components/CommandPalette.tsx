import * as React from "react"
import {
    Calculator,
    CreditCard,
    Settings,
    User,
    LayoutDashboard,
    GitBranch,
    Building2,
    Wallet,
    Search,
    Plus
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useLocation } from "wouter"
import { useScenario } from "@/contexts/ScenarioContext"

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const [location, setLocation] = useLocation();
    const { setCurrentScenarioId } = useScenario(); // Example interaction

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/properties"))}>
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Properties</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/comparison"))}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        <span>Comparison</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Tools">
                    <CommandItem onSelect={() => runCommand(() => setLocation("/tools/pay-calculator"))}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Pay Calculator</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/tools/mortgage-calculator"))}>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Mortgage Monster</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => setLocation("/profile"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
