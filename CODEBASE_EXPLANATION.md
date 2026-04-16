# 📚 Codebase Explanation for Beginners

## 🎯 What is This Project?

This is a **SOW (Statement of Work) Generator** - a web application that helps users create professional business documents called "Statements of Work" using AI. Think of it like a smart document editor that can automatically generate business proposals based on your requirements.

**SOW** = A formal document that outlines the scope, deliverables, timeline, and responsibilities for a project between two parties (like a company and a client).

---

## 🏗️ Project Structure Overview

```
dm-sow-generator/
├── app/                    # Main application pages (Next.js App Router)
├── components/             # Reusable UI components
├── store/                  # State management (Zustand)
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
├── public/                 # Static assets (images, icons)
└── Configuration files     # Settings for Next.js, TypeScript, etc.
```

---

## 🛠️ Technology Stack (What Technologies Are Used?)

### **Frontend Framework: Next.js 16**
- **What it is**: A React framework that makes building web apps easier
- **Why used**: Provides server-side rendering, routing, and optimization out of the box
- **Key feature**: Uses the "App Router" (modern Next.js routing system)

### **UI Library: React 19**
- **What it is**: A JavaScript library for building user interfaces
- **Why used**: Makes it easy to create interactive, component-based UIs

### **State Management: Zustand**
- **What it is**: A lightweight state management library
- **Why used**: Stores app data (documents, messages, files) and makes it accessible across components
- **Location**: `store/sowStore.ts`

### **Styling: Tailwind CSS**
- **What it is**: A utility-first CSS framework
- **Why used**: Makes styling faster with pre-built classes like `bg-white`, `p-4`, etc.

### **Document Export Libraries**
- **jsPDF**: Converts HTML to PDF files
- **docx**: Creates Word (.docx) documents
- **file-saver**: Downloads files to user's computer

---

## 📁 Key Files Explained

### 1. **`app/page.tsx`** - Main Page Component
**What it does**: This is the main page that users see when they visit the website.

**Key responsibilities**:
- Combines all three main sections: Sidebar, Document Editor, and AI Assistant
- Handles file uploads (converts files to base64 format)
- Manages communication with the AI API to generate SOW documents
- Handles saving and exporting documents

**Important functions**:
- `handleFileUpload()`: Reads uploaded files and stores them
- `handleGenerate()`: Calls the AI API to create a SOW document
- `handleSave()`: Saves the current document to the recent files list
- `handleExport()`: Exports document as PDF or Word file

---

### 2. **`store/sowStore.ts`** - State Management Store
**What it does**: This is the "brain" that remembers all the app's data.

**What it stores**:
- `currentDocument`: The HTML content of the document being edited
- `uploadedFiles`: List of files the user uploaded for context
- `recentFiles`: Previously saved documents
- `messages`: Chat messages between user and AI assistant
- `selectedFile`: Currently selected document from recent files

**Key features**:
- **Persistence**: Uses `localStorage` to save data even after browser closes
- **Hydration**: Handles Next.js server-side rendering properly
- **Actions**: Functions to update the state (like `updateDocument`, `addMessage`)

**Example**: When you type in the editor, `updateDocument()` is called to save your changes.

---

### 3. **`components/DocumentEditor.tsx`** - Rich Text Editor
**What it does**: This is where users write and edit their SOW documents.

**Features**:
- **Rich text editing**: Bold, italic, underline, colors, lists, etc.
- **Keyboard shortcuts**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+Z (undo)
- **Professional styling**: Styles the document to look like a real SOW
- **Export buttons**: Save, Share, Export (PDF/Word)

**How it works**:
- Uses `contentEditable` (HTML5 feature) to make the div editable
- Uses `document.execCommand()` to apply formatting (bold, italic, etc.)
- Tracks cursor position to prevent losing your place when content updates

---

### 4. **`components/AIAssistant.tsx`** - Chat Interface
**What it does**: The right sidebar where users chat with the AI and upload files.

**Features**:
- Chat interface showing messages from user and AI
- File upload area (drag & drop or click to upload)
- List of uploaded context files
- "Generate SOW" button to create the document

**How it works**:
- Displays messages in a chat-like format
- User messages appear on the right (green), AI messages on the left (gray)
- Auto-scrolls to latest message
- File upload converts files to base64 (text format) for storage

---

### 5. **`components/Sidebar.tsx`** - Recent Files List
**What it does**: Shows a list of previously saved documents on the left side.

**Features**:
- Search bar to find documents
- Shows document name, timestamp, and size
- Click a document to open it in the editor

**How it works**:
- Receives `recentFiles` array from the store
- Filters files based on search query
- Calls `onFileSelect()` when user clicks a file

---

### 6. **`lib/exportUtils.ts`** - Export Functions
**What it does**: Converts the HTML document into PDF or Word format.

**Two main functions**:

**`exportToPDF()`**:
- Creates a PDF using jsPDF library
- Adds cover page with logo, title, and date
- Converts HTML elements (headings, paragraphs, tables) to PDF format
- Adds footer with company information and page numbers
- Downloads the PDF file

**`exportToWord()`**:
- Creates a Word document using docx library
- More complex formatting (cover page, table of contents, headers, footers)
- Preserves formatting like bold, italic, colors, tables
- Adds professional footer matching Datamellon template
- Downloads the .docx file

**Key challenge**: Converting HTML (web format) to PDF/Word (document formats) requires parsing HTML and recreating it in the target format.

---

### 7. **`types/index.ts`** - Type Definitions
**What it does**: Defines the "shape" of data used throughout the app (TypeScript).

**Types defined**:
- `RecentFile`: Structure for saved documents (id, name, timestamp, size, content)
- `Message`: Structure for chat messages (id, role: "user" or "assistant", content)
- `UploadedFile`: Structure for uploaded files (id, name, size, type, content)

**Why important**: TypeScript uses these to catch errors and provide autocomplete in your code editor.

---

### 8. **`app/layout.tsx`** - Root Layout
**What it does**: Wraps all pages with common elements (like fonts, metadata).

**Features**:
- Sets page title and description
- Loads Raleway font from Google Fonts
- Applies font to entire app

---

## 🔄 How the App Works (User Flow)

### Step 1: User Opens the App
- App loads from `app/page.tsx`
- Store rehydrates (loads) saved data from `localStorage`
- User sees three sections: Sidebar (empty), Editor (empty), AI Assistant (welcome message)

### Step 2: User Uploads Context Files (Optional)
- User drags files or clicks "Upload Context Files" in AI Assistant
- Files are read as base64 (text format) and stored in `uploadedFiles` array
- Files appear in the uploaded files list

### Step 3: User Describes Requirements
- User types in the chat input: "Create a SOW for a web development project"
- Message is added to `messages` array
- AI responds (currently a placeholder response)

### Step 4: User Clicks "Generate SOW"
- `handleGenerate()` function runs
- Creates FormData with prompt, uploaded files, and options
- Sends POST request to `/generate-sow` API endpoint
- Shows loading spinner
- API returns HTML content
- HTML is set as `currentDocument` in the store
- Document appears in the editor

### Step 5: User Edits Document
- User can format text, add content, etc. in the rich text editor
- Changes are saved to `currentDocument` in real-time

### Step 6: User Saves Document
- Clicks "Save" button
- Prompts for document title
- Creates new `RecentFile` and adds to `recentFiles` array
- Document appears in Sidebar

### Step 7: User Exports Document
- Clicks "Export" → chooses PDF or Word
- `exportToPDF()` or `exportToWord()` runs
- Document is converted and downloaded to user's computer

---

## 🔑 Key Concepts Explained

### **State Management (Zustand)**
**What**: A way to store and share data across components.

**Why needed**: Without it, each component would need to pass data through props (messy!). With Zustand, any component can access the store directly.

**Example**:
```typescript
// In any component:
const { currentDocument, updateDocument } = useSOWStore();
// Now you can read currentDocument and call updateDocument()
```

### **Persistence (localStorage)**
**What**: Saves data to browser's local storage so it survives page refreshes.

**How**: Zustand's `persist` middleware automatically saves/loads data.

**What's saved**: Documents, recent files, uploaded files, messages (but NOT selectedFile or isHydrated - those are temporary)

### **Base64 Encoding**
**What**: Converts binary files (PDFs, images) into text format.

**Why needed**: 
- Can store in JavaScript variables
- Can send in API requests
- Can store in localStorage

**Example**: A PDF file becomes a long string like `data:application/pdf;base64,JVBERi0xLjQK...`

### **ContentEditable**
**What**: An HTML attribute that makes a div editable like a text input.

**How used**: The editor div has `contentEditable={true}`, making it editable.

**Challenge**: Need to track cursor position and prevent content loss when React re-renders.

### **FormData**
**What**: A way to send files and form data to a server.

**Why used**: The API needs files, so we use FormData instead of JSON.

**Example**:
```typescript
const form = new FormData();
form.append("prompt", "Create SOW");
form.append("context_files", blob, "file.pdf");
fetch("/generate-sow", { method: "POST", body: form });
```

---

## 🎨 UI/UX Design Patterns

### **Three-Panel Layout**
- **Left**: Recent files (persistent navigation)
- **Center**: Main editor (focus area)
- **Right**: AI assistant (helper/tools)

This is similar to VS Code, Notion, or Google Docs.

### **Empty States**
When there's no content, show helpful messages:
- "Generate your professional SOW with AI"
- Tips on how to get started

### **Loading States**
- Shows spinner overlay when generating document
- Prevents user from clicking buttons multiple times

### **Error Handling**
- If API fails, shows error message in chat
- Falls back to template document if generation fails

---

## 🔧 Configuration Files

### **`package.json`**
- Lists all dependencies (libraries the app needs)
- Defines scripts: `npm run dev` (start dev server), `npm run build` (create production build)

### **`tsconfig.json`**
- TypeScript configuration
- Sets path aliases (`@/*` means root directory)
- Enables strict type checking

### **`next.config.ts`**
- Next.js configuration
- Currently minimal (no special settings)

### **`tailwind.config.ts`**
- Tailwind CSS configuration
- Defines custom colors, fonts, etc.

---

## 🐛 Common Issues & Solutions

### Issue: Hydration Mismatch
**Problem**: Server renders one thing, client renders another (causes errors).

**Solution**: Store uses `skipHydration: true` and manually rehydrates on client side.

### Issue: Cursor Position Lost
**Problem**: When React updates content, cursor jumps to beginning.

**Solution**: `saveCursorPosition()` and `restoreCursorPosition()` functions track and restore cursor.

### Issue: File Size Limits
**Problem**: localStorage has size limits (~5-10MB).

**Solution**: Only stores essential data, not full file contents long-term.

---

## 🚀 How to Run the Project

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:3000`

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📝 Summary

This is a **full-stack web application** built with:
- **Next.js** (React framework)
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **TypeScript** (type safety)

**Main features**:
1. AI-powered document generation
2. Rich text editing
3. File uploads for context
4. Document saving and management
5. PDF/Word export

**Architecture**:
- **Components**: Reusable UI pieces
- **Store**: Centralized state management
- **Utils**: Helper functions (export)
- **Types**: Data structure definitions

The app follows modern React patterns and best practices for maintainability and user experience.

---

## 📦 Unused Components (For Reference)

These components exist in the codebase but are not currently being used:

- **`components/MainContent.tsx`**: An older/alternative version of the main content area (likely replaced by DocumentEditor)
- **`components/MarkdownViewer.tsx`**: A component for rendering Markdown content (not currently integrated)
- **`components/RecentFiles.tsx`**: Empty file (functionality is in Sidebar.tsx instead)

These might be:
- Leftover from earlier development
- Planned for future features
- Alternative implementations

---

## 🎓 Learning Resources

If you want to learn more about these technologies:

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Zustand**: https://github.com/pmndrs/zustand
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Questions?** Feel free to explore the code - each file is well-organized and follows clear patterns!
