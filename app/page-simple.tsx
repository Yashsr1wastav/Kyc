'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            GenAI Helpdesk
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Intelligent document Q&A powered by IBM Watson Discovery, Watsonx.ai Granite, and AWS Titan. 
            Upload your documents and get instant, accurate answers from your knowledge base.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Upload Documents
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
