import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function InternalActivitiesSimple() {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li>
                  <Link href="/">
                    <a className="hover:text-gray-200">Home</a>
                  </Link>
                </li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Internal Activities</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-bold text-white mt-2">Internal Activities</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage self-referential activities within applications
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Internal Activity
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-white">
          <h2 className="text-xl mb-4">Debug Mode</h2>
          <p>This is a simplified version to test if the page loads.</p>
        </div>
      </div>
    </div>
  );
}