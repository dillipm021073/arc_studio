import { BarChart3, Clock, Code, Layers, FileText, TrendingUp, Database } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TMFDomainReport from "@/components/reports/tmf-domain-report";

export default function Reports() {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Reports</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Reports & Analytics</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          <Tabs defaultValue="tmf-domain" className="space-y-4">
            <TabsList className="bg-white">
              <TabsTrigger value="tmf-domain" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                TM Forum Domain
              </TabsTrigger>
              <TabsTrigger value="interface-summary" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Interface Summary
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="data-quality" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tmf-domain">
              <Card className="p-6">
                <TMFDomainReport />
              </Card>
            </TabsContent>

            <TabsContent value="interface-summary">
              <Card className="p-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Interface Summary Report</h3>
                  <p className="text-gray-600">Coming soon: Comprehensive interface analysis and metrics</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card className="p-6">
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Trend Analysis</h3>
                  <p className="text-gray-600">Coming soon: Historical trends and predictive insights</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="data-quality">
              <Card className="p-6">
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Data Quality Report</h3>
                  <p className="text-gray-600">Coming soon: Data completeness and quality metrics</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Coming Soon Features */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">More reports coming soon:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                <BarChart3 className="w-3 h-3 mr-1" />
                Interface Usage Analytics
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                <Clock className="w-3 h-3 mr-1" />
                Change Request Trends
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                <Code className="w-3 h-3 mr-1" />
                System Health Reports
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}