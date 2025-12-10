
import React from 'react';
import { Card } from '@/components/ui/card';

export function ProjectionsTable({ data }: { data: any[] }) {
    return (
        <div className="rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="text-left">
                        <th className="p-4 font-medium">Year</th>
                        <th className="p-4 font-medium">Value</th>
                        <th className="p-4 font-medium">Debt</th>
                        <th className="p-4 font-medium">Equity</th>
                        <th className="p-4 font-medium">Cashflow</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-t">
                            <td className="p-4">{row.year}</td>
                            <td className="p-4">{row["Portfolio Value"]}</td>
                            <td className="p-4">{row["Total Debt"]}</td>
                            <td className="p-4">{row["Portfolio Equity"]}</td>
                            <td className="p-4">{row["Net Cashflow"]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
