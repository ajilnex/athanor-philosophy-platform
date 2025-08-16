import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BacklinkPicker } from '../../components/editor/BacklinkPicker'

// Mock fetch pour les appels API
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockBillets = [
  {
    slug: 'premier-billet',
    title: 'Premier Billet de Test',
    date: '2025-08-01',
  },
  {
    slug: 'deuxieme-billet',
    title: 'Deuxième Billet sur React',
    date: '2025-08-02',
  },
  {
    slug: 'troisieme-billet',
    title: 'Troisième Billet Philosophy',
    date: '2025-08-03',
  },
]

describe('BacklinkPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSelect: jest.fn(),
    onCreateNew: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBillets),
    })
  })

  describe('Rendu et état initial', () => {
    it('ne rend rien quand isOpen est false', () => {
      render(<BacklinkPicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('rend le dialogue quand isOpen est true', async () => {
      render(<BacklinkPicker {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Rechercher un billet...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Alias (optionnel)')).toBeInTheDocument()
    })

    it('charge et affiche la liste des billets', async () => {
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
        expect(screen.getByText('Deuxième Billet sur React')).toBeInTheDocument()
        expect(screen.getByText('Troisième Billet Philosophy')).toBeInTheDocument()
      })
    })

    it('affiche un indicateur de chargement initial', () => {
      // Mock fetch lent
      mockFetch.mockReturnValue(new Promise(() => {}))

      render(<BacklinkPicker {...defaultProps} />)

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })
  })

  describe('Recherche et filtrage', () => {
    it('filtre les billets selon la recherche', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      // Attendre le chargement
      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.type(searchInput, 'React')

      // Seul le billet contenant 'React' doit être visible
      expect(screen.getByText('Deuxième Billet sur React')).toBeInTheDocument()
      expect(screen.queryByText('Premier Billet de Test')).not.toBeInTheDocument()
      expect(screen.queryByText('Troisième Billet Philosophy')).not.toBeInTheDocument()
    })

    it('affiche l\'option "Créer nouveau" quand aucun résultat', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.type(searchInput, 'inexistant')

      expect(screen.getByText('Créer nouveau : "inexistant"')).toBeInTheDocument()
    })

    it('recherche insensible à la casse', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.type(searchInput, 'PHILOSOPHY')

      expect(screen.getByText('Troisième Billet Philosophy')).toBeInTheDocument()
    })
  })

  describe('Sélection et interactions', () => {
    it('sélectionne un billet existant au clic', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Premier Billet de Test'))

      expect(defaultProps.onSelect).toHaveBeenCalledWith('premier-billet', undefined)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('sélectionne avec alias', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const aliasInput = screen.getByPlaceholderText('Alias (optionnel)')
      await user.type(aliasInput, 'Mon Alias')
      await user.click(screen.getByText('Premier Billet de Test'))

      expect(defaultProps.onSelect).toHaveBeenCalledWith('premier-billet', 'Mon Alias')
    })

    it('crée un nouveau billet', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.type(searchInput, 'Nouveau Billet')

      await user.click(screen.getByText('Créer nouveau : "Nouveau Billet"'))

      expect(defaultProps.onCreateNew).toHaveBeenCalledWith('Nouveau Billet', undefined)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('ferme au clic sur le bouton fermer', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      const closeButton = screen.getByLabelText(/fermer/i)
      await user.click(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it("ferme au clic sur l'overlay", async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      // Clic sur l'overlay (élément avec classe backdrop)
      const overlay = screen.getByRole('dialog').parentElement
      if (overlay) {
        await user.click(overlay)
        expect(defaultProps.onClose).toHaveBeenCalled()
      }
    })
  })

  describe('Navigation au clavier', () => {
    it('navigue avec les flèches haut/bas', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.click(searchInput)

      // Premier élément doit être sélectionné par défaut
      expect(screen.getByText('Premier Billet de Test')).toHaveClass('bg-blue-50')

      // Flèche bas
      await user.keyboard('{ArrowDown}')
      expect(screen.getByText('Deuxième Billet sur React')).toHaveClass('bg-blue-50')

      // Flèche haut
      await user.keyboard('{ArrowUp}')
      expect(screen.getByText('Premier Billet de Test')).toHaveClass('bg-blue-50')
    })

    it('sélectionne avec Entrée', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.click(searchInput)
      await user.keyboard('{Enter}')

      expect(defaultProps.onSelect).toHaveBeenCalledWith('premier-billet', undefined)
    })

    it('ferme avec Échap', async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe("Gestion d'erreurs", () => {
    it("affiche un message d'erreur si le fetch échoue", async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Erreur lors du chargement des billets')).toBeInTheDocument()
      })
    })

    it("gère les réponses d'API non-ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Erreur lors du chargement des billets')).toBeInTheDocument()
      })
    })
  })

  describe('Edge cases', () => {
    it('gère une liste vide de billets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Aucun billet trouvé')).toBeInTheDocument()
      })
    })

    it("trim les espaces dans l'alias", async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const aliasInput = screen.getByPlaceholderText('Alias (optionnel)')
      await user.type(aliasInput, '  Mon Alias  ')
      await user.click(screen.getByText('Premier Billet de Test'))

      expect(defaultProps.onSelect).toHaveBeenCalledWith('premier-billet', 'Mon Alias')
    })

    it("n'appelle pas onCreateNew si non fourni", async () => {
      const user = userEvent.setup()
      render(<BacklinkPicker {...defaultProps} onCreateNew={undefined} />)

      await waitFor(() => {
        expect(screen.getByText('Premier Billet de Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un billet...')
      await user.type(searchInput, 'inexistant')

      // Ne doit pas afficher l'option créer nouveau
      expect(screen.queryByText(/Créer nouveau/)).not.toBeInTheDocument()
    })
  })
})
