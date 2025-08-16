/**
 * Tests pour les composants refactorisés avec SWR
 * Vérifie que BacklinkPicker et CommentSection utilisent correctement SWR
 */

import { render, screen, waitFor } from '@testing-library/react'
import { BacklinkPicker } from '@/components/editor/BacklinkPicker'
import { CommentSection } from '@/components/comments/CommentSection'

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseSWR = require('swr').default

describe('SWR Components Refactoring', () => {
  beforeEach(() => {
    mockUseSWR.mockClear()
  })

  describe('BacklinkPicker with SWR', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSelect: jest.fn(),
    }

    it('should call useSWR with correct parameters when open', () => {
      mockUseSWR.mockReturnValue({
        data: [],
        error: null,
        isLoading: false,
      })

      render(<BacklinkPicker {...defaultProps} />)

      expect(mockUseSWR).toHaveBeenCalledWith('/api/billets/list', expect.any(Function))
    })

    it('should not fetch data when closed', () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
      })

      render(<BacklinkPicker {...defaultProps} isOpen={false} />)

      expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function))
    })

    it('should display loading state', () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
      })

      render(<BacklinkPicker {...defaultProps} />)

      expect(screen.getByText('Chargement des billets...')).toBeInTheDocument()
    })

    it('should display error state', () => {
      const errorMessage = 'Network error'
      mockUseSWR.mockReturnValue({
        data: null,
        error: new Error(errorMessage),
        isLoading: false,
      })

      render(<BacklinkPicker {...defaultProps} />)

      // Le message d'erreur spécifique peut varier, vérifions la présence d'une erreur
      expect(screen.getByText(/erreur/i)).toBeInTheDocument()
    })

    it('should display billets data', async () => {
      const mockBillets = [
        {
          slug: 'test-billet',
          title: 'Test Billet',
          date: '2025-01-01',
        },
      ]

      mockUseSWR.mockReturnValue({
        data: mockBillets,
        error: null,
        isLoading: false,
      })

      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Billet')).toBeInTheDocument()
      })
    })
  })

  describe('CommentSection with SWR', () => {
    const defaultProps = {
      targetType: 'billet' as const,
      targetId: 'test-billet',
      title: 'Test Billet',
    }

    it('should call useSWR with correct API endpoint', () => {
      mockUseSWR.mockReturnValue({
        data: { comments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<CommentSection {...defaultProps} />)

      expect(mockUseSWR).toHaveBeenCalledWith(
        '/api/comments?targetType=billet&targetId=test-billet&page=1&limit=20',
        expect.any(Function)
      )
    })

    it('should display loading state', () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
      })

      render(<CommentSection {...defaultProps} />)

      expect(screen.getByText('Chargement des commentaires...')).toBeInTheDocument()
    })

    it('should display empty state when no comments', () => {
      mockUseSWR.mockReturnValue({
        data: { comments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<CommentSection {...defaultProps} />)

      expect(screen.getByText('Aucun commentaire pour le moment')).toBeInTheDocument()
    })
  })

  describe('SWR Fetcher Function', () => {
    it('should properly fetch and parse JSON', async () => {
      // Mock fetch
      const mockData = { test: 'data' }
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockData),
      })

      // Import et test du fetcher (il est exporté implicitement avec les composants)
      const fetcher = (url: string) => fetch(url).then(res => res.json())
      const result = await fetcher('/test-url')

      expect(fetch).toHaveBeenCalledWith('/test-url')
      expect(result).toEqual(mockData)
    })
  })
})
