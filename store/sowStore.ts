import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RecentFile, Message, UploadedFile } from '@/types';

interface SOWStore {
  // State
  currentDocument: string;
  uploadedFiles: UploadedFile[];
  recentFiles: RecentFile[];
  messages: Message[];
  selectedFile: RecentFile | null;
  isHydrated: boolean; // Optional: track hydration status

  // Actions
  updateDocument: (content: string) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  addMessage: (message: Message) => void;
  selectFile: (file: RecentFile | null) => void;
  saveCurrentDocument: (title: string) => void;
  setHydrated: (status: boolean) => void; // Optional: for hydration tracking
}

export const useSOWStore = create<SOWStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentDocument: '',
      uploadedFiles: [],
      recentFiles: [
        {
          id: '1',
          name: 'Project Alpha SOW',
          timestamp: '2 hours ago',
          size: '245 KB',
          content: '<h1>Project Alpha Statement of Work</h1><p>This document outlines the scope of work...</p>'
        },
        {
          id: '2',
          name: 'Client Beta Proposal',
          timestamp: 'Yesterday',
          size: '189 KB',
          content: '<h1>Client Beta Proposal</h1><p>Project overview and deliverables...</p>'
        },
        {
          id: '3',
          name: 'Q4 Deliverables',
          timestamp: '3 days ago',
          size: '312 KB',
          content: '<h1>Q4 Deliverables</h1><p>Quarterly objectives and milestones...</p>'
        },
      ],
      
      // FIX: Start with a user message so AWS Bedrock never gets an empty/invalid conversation
      messages: [
      //   {
      //   id: 'init-' + Date.now(),
      //   role: 'user',
      //   content: 'Initialize SOW generation session.'
      // }
    ],
      
      selectedFile: null,
      isHydrated: false, // Track if store has rehydrated from localStorage

      // Actions
      updateDocument: (content) => set({ currentDocument: content }),

      addUploadedFile: (file) => set((state) => ({
        uploadedFiles: [...state.uploadedFiles, file]
      })),

      removeUploadedFile: (id) => set((state) => ({
        uploadedFiles: state.uploadedFiles.filter(f => f.id !== id)
      })),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),

      selectFile: (file) => set({
        selectedFile: file,
        currentDocument: file?.content || ''
      }),

      setHydrated: (status) => set({ isHydrated: status }),

      saveCurrentDocument: (title) => {
        const state = get();
        const newFile: RecentFile = {
          id: Date.now().toString(),
          name: title,
          timestamp: 'Just now',
          size: `${Math.floor(state.currentDocument.length / 1024)} KB`,
          content: state.currentDocument
        };
        
        set({
          recentFiles: [newFile, ...state.recentFiles],
          selectedFile: newFile
        });
      }
    }),
    {
      name: 'sow-storage', // localStorage key
      skipHydration: true, // For Next.js - prevents SSR/hydration mismatch
      
      // Optional: Listen for rehydration completion
      onRehydrateStorage: (state) => {
        console.log('Store rehydrated from localStorage');
        // You can set hydrated flag here if components need to wait
        return (state, error) => {
          if (!error && state) {
            state.setHydrated(true);
          }
        };
      },
      
      // Optional: Only persist specific fields (exclude selectedFile, isHydrated)
      partialize: (state) => ({
        currentDocument: state.currentDocument,
        uploadedFiles: state.uploadedFiles,
        recentFiles: state.recentFiles,
        messages: state.messages,
        // Don't persist: selectedFile, isHydrated
      }),
    }
  )
);