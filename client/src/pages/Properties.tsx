import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search, Grid3x3, List } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { PremiumPropertyChart } from "@/components/charts/PremiumPropertyChart";

export default function Properties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: properties, isLoading } = trpc.properties.list.useQuery();

  const filteredProperties =
    properties?.filter(
      (p) => p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const formatCurrency = (cents: number | string) => {
    const val = typeof cents === 'string' ? parseFloat(cents) : cents;
    return `$${(val / 100).toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generate Chart Data (Mock Projection)
  const totalValue = properties?.reduce((sum, p) => sum + p.purchasePrice, 0) || 0;
  const mockChartData = Array.from({ length: 11 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    const growthRate = 1.05; // 5% growth
    const value = totalValue * Math.pow(growthRate, i);
    const loan = value * 0.8 * (Math.pow(0.97, i)); // Assuming pay down
    return {
      year,
      value,
      loan,
      equity: value - loan
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your property portfolio</p>
          </div>
          <Link href="/properties/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto py-8 space-y-8">
        {/* Premium Chart Section */}
        {properties && properties.length > 0 && (
          <PremiumPropertyChart
            data={mockChartData}
            title="Portfolio Projection"
            description="Estimated value and equity growth over the next 10 years (5% growth assumption)"
            className="shadow-sm border-gray-200"
          />
        )}

        <Card>
          <CardContent className="pt-6">
            {/* Search and View Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Properties Display */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading properties...</p>
                </div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? "No properties found" : "No properties yet"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery ? "Try adjusting your search" : "Add your first property to get started"}
                  </p>
                  {!searchQuery && (
                    <Link href="/properties/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                {filteredProperties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{property.nickname}</h3>
                          <p className="text-sm text-gray-500 truncate">{property.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Ownership</p>
                          <p className="text-sm font-medium text-gray-900">{property.ownershipStructure}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Purchase Price</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(property.purchasePrice)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Purchase Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(property.purchaseDate)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Status</p>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${property.status === "Actual" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {property.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProperties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                          <Building2 className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{property.nickname}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{property.address}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Purchase Price</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(property.purchasePrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">Status</span>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${property.status === "Actual" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {property.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
