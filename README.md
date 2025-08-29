# GenAI Helpdesk

A comprehensive Next.js 14 application that provides intelligent document Q&A capabilities using IBM Watson Discovery, Watsonx.ai Granite, and AWS Titan. Upload your documents and get instant, accurate answers powered by enterprise-grade AI services.

![GenAI Helpdesk](screenshots/hero.png)

## 🚀 Features

### Core Functionality
- **Smart Document Upload**: Support for PDF, Word documents (DOCX/DOC), and text files
- **Intelligent Search**: Semantic search across all uploaded documents using IBM Watson Discovery
- **AI Summarization**: Concise summaries powered by IBM Watsonx.ai Granite model
- **Grounded Answers**: Comprehensive responses synthesized using Amazon Titan Text
- **Source Attribution**: Clear source references with filename and page numbers
- **Strict Mode**: Toggle to ensure answers are only based on uploaded documents

### Technical Features
- **Real-time Streaming**: Instant responses with streaming AI text generation
- **Modern UI**: Clean, responsive design with Shadcn UI components
- **Dark Mode**: Full dark mode support
- **Authentication**: Simple credential-based admin access
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **File Processing**: Automatic text extraction and intelligent chunking

## 🏗️ Architecture

### RAG Pipeline
1. **Document Ingestion**: Upload → Text Extraction → Chunking → IBM Discovery
2. **Query Processing**: User Question → Discovery Search → Content Retrieval
3. **AI Processing**: Chunks → Granite Summarization → Titan Answer Generation
4. **Response**: Grounded Answer + Source Attribution

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **AI Services**: 
  - IBM Watson Discovery (document search)
  - Watsonx.ai Granite (summarization)
  - AWS Titan Text (answer generation)
- **Authentication**: NextAuth.js
- **File Processing**: pdf-parse, mammoth
- **Testing**: Jest, Testing Library

## 📋 Prerequisites

### Required Services
1. **IBM Cloud Account** with Watson Discovery and Watsonx.ai access
2. **AWS Account** with Bedrock access for Titan models
3. **Node.js** 18+ and npm

### API Keys & Configuration
You'll need the following environment variables:

```env
# IBM Watson Discovery
IBM_DISCOVERY_APIKEY=your_discovery_api_key_here
IBM_DISCOVERY_URL=https://api.us-south.discovery.watson.cloud.ibm.com/instances/your_instance_id
IBM_DISCOVERY_PROJECT_ID=your_project_id_here
IBM_DISCOVERY_COLLECTION_ID=your_collection_id_here

# Watsonx.ai Granite
WATSONX_APIKEY=your_watsonx_api_key_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_BEDROCK_TITAN_MODEL_ID=amazon.titan-text-premier-v1

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here
```

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd genai-helpdesk
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys and configuration
```

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Upload Documents
1. Navigate to `/upload`
2. Drag and drop your PDF, Word, or text files
3. Wait for processing to complete

### 5. Start Chatting
1. Go to `/chat`
2. Ask questions about your uploaded documents
3. Toggle strict mode as needed

## 🔧 Configuration

### IBM Watson Discovery Setup
1. Create a Watson Discovery instance
2. Create a project and collection
3. Note down the API key, URL, project ID, and collection ID

### Watsonx.ai Setup
1. Get access to Watsonx.ai
2. Generate API key for Granite model access
3. Note the service URL (typically us-south.ml.cloud.ibm.com)

### AWS Bedrock Setup
1. Enable Bedrock in your AWS account
2. Request access to Titan Text models
3. Create IAM user with Bedrock permissions
4. Generate access keys

## 📁 Project Structure

```
genai-helpdesk/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── upload/page.tsx    # Document upload
│   ├── chat/page.tsx      # Chat interface
│   ├── admin/page.tsx     # Admin panel
│   └── api/               # API routes
│       ├── upload/        # File upload endpoint
│       ├── chat/          # Chat API
│       ├── admin/         # Admin operations
│       └── auth/          # NextAuth configuration
├── components/            # Reusable UI components
│   ├── UploadBox.tsx     # File upload component
│   ├── ChatUI.tsx        # Chat interface
│   ├── SourceList.tsx    # Source attribution
│   └── ui/               # Shadcn UI components
├── lib/                   # Core business logic
│   ├── ibmDiscovery.ts   # Watson Discovery integration
│   ├── ibmGranite.ts     # Watsonx.ai Granite integration
│   ├── awsTitan.ts       # AWS Titan integration
│   ├── chunker.ts        # Document chunking utilities
│   └── env.ts            # Environment configuration
├── tests/                 # Test suites
│   ├── chunker.test.ts   # Chunking functionality tests
│   └── ragPipeline.test.ts # RAG pipeline integration tests
└── uploads/              # Temporary file storage
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- Document chunking functionality
- RAG pipeline integration
- Error handling scenarios
- Mock external service integrations

## 🔐 Security Considerations

### Environment Variables
- Store all sensitive data in `.env.local`
- Never commit API keys to version control
- Use strong passwords for admin access

### File Upload Security
- File type validation (PDF, DOCX, DOC, TXT only)
- File size limits (10MB maximum)
- Content sanitization during processing

### Authentication
- Simple credential-based authentication for admin panel
- Session management via NextAuth.js
- Protected API routes

## 🚀 Deployment

### Environment Setup
1. Set up environment variables on your hosting platform
2. Ensure all API keys and secrets are properly configured
3. Set `NEXTAUTH_URL` to your production domain

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Hosting Recommendations
- **Vercel**: Optimal for Next.js applications
- **AWS**: Good integration with existing AWS services
- **Azure**: Good integration with IBM services

## 📊 Usage Examples

### Uploading Documents
![Upload Interface](screenshots/upload.png)

### Chat Interface
![Chat Interface](screenshots/chat.png)

### Admin Panel
![Admin Panel](screenshots/admin.png)

## 🔧 Customization

### Chunking Configuration
Modify chunking parameters in `lib/chunker.ts`:
```typescript
const DEFAULT_CHUNKING_OPTIONS = {
  chunkSize: 1000,        // Characters per chunk
  chunkOverlap: 200,      // Overlap between chunks
  minChunkSize: 100,      // Minimum chunk size
};
```

### AI Model Parameters
Adjust model parameters in respective service files:
- `lib/ibmGranite.ts` - Granite model settings
- `lib/awsTitan.ts` - Titan model configuration

### UI Customization
- Modify Tailwind configuration in `tailwind.config.js`
- Customize Shadcn UI components in `components/ui/`
- Adjust theme colors and styling

## 🐛 Troubleshooting

### Common Issues

#### "Failed to connect to IBM Discovery"
- Verify API key and URL in `.env.local`
- Check network connectivity
- Ensure Discovery instance is active

#### "AWS Bedrock access denied"
- Verify AWS credentials and permissions
- Check if Titan models are enabled in your region
- Ensure proper IAM policy is attached

#### "File upload fails"
- Check file size (must be under 10MB)
- Ensure file type is supported (PDF, DOCX, DOC, TXT)
- Verify upload directory permissions

#### "Authentication not working"
- Check NEXTAUTH_SECRET is set
- Verify admin credentials in `.env.local`
- Clear browser cookies and try again

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Add JSDoc comments for functions
- Include tests for new features
- Follow existing code style
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **IBM Watson** for Discovery and Granite AI services
- **AWS** for Bedrock and Titan models
- **Vercel** for Next.js framework
- **Shadcn** for beautiful UI components
- **Lucide** for icons

## 📞 Support

For support and questions:
1. Check the troubleshooting section above
2. Review the [GitHub Issues](issues) for known problems
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ using Next.js 14, IBM Watson, and AWS Titan**
