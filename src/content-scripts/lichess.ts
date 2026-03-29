/**
 * Lichess Content Script
 * Detects game pages and injects the LocalMax Analysis button.
 * 3-Layer PGN extraction system adapted for Lichess DOM.
 */

(function () {
    if (document.getElementById('localmax-injected-lichess')) return;

    const BUTTON_ID = 'localmax-analysis-btn-lichess';
    let injected = false;

    // ───── Layer 1: Global Objects ─────
    function extractFromGlobalObjects(): string | null {
        try {
            const w = window as any;
            // Lichess exposes analysis data on the lichess object
            if (w.lichess?.analysis?.data?.game?.pgn) return w.lichess.analysis.data.game.pgn;
            if (w.lichess?.round?.data?.game?.pgn) return w.lichess.round.data.game.pgn;

            // Try data attributes on body
            const gameData = document.body.dataset.gameId;
            if (gameData) {
                const analysisEl = document.querySelector('.analyse__board');
                if (analysisEl) {
                    const ctrl = (analysisEl as any).__vue__?.pgn;
                    if (ctrl) return ctrl;
                }
            }
        } catch (e) {
            console.log('[LocalMax] Lichess Layer 1 failed:', e);
        }
        return null;
    }

    // ───── Layer 2: DOM Reconstruction ─────
    function extractFromDOM(): string | null {
        try {
            // Lichess uses <move> elements or <kwdb> elements
            const moveEls = document.querySelectorAll(
                'move, .tview2 move, l4x move, .analyse__moves move, .moves move'
            );

            if (moveEls.length === 0) {
                // Try alternate selector
                const altMoves = document.querySelectorAll('.move, .fbt');
                if (altMoves.length === 0) return null;
            }

            const moves: string[] = [];
            moveEls.forEach((el) => {
                const san = el.querySelector('san')?.textContent?.trim() || el.textContent?.trim();
                if (san && san.length > 0 && san.length < 10) {
                    moves.push(san);
                }
            });

            if (moves.length < 2) return null;

            let pgn = '';
            for (let i = 0; i < moves.length; i++) {
                if (i % 2 === 0) {
                    pgn += `${Math.floor(i / 2) + 1}. `;
                }
                pgn += moves[i] + ' ';
            }

            // Result
            const resultEl = document.querySelector('.result-wrap, .status');
            if (resultEl?.textContent) {
                const resultMatch = resultEl.textContent.match(/(1-0|0-1|1\/2-1\/2|\*)/);
                if (resultMatch) pgn += resultMatch[0];
            }

            return pgn.trim();
        } catch (e) {
            console.log('[LocalMax] Lichess Layer 2 failed:', e);
        }
        return null;
    }

    // ───── Layer 3: Clipboard Fallback ─────
    function promptManualPGN(): void {
        const pgn = prompt(
            '🔬 LocalMax Analyzer\n\nCould not auto-extract the game.\n\n' +
            'Please paste your PGN here:\n' +
            '(On Lichess: click the menu ≡ → "PGN" → copy, then paste here)'
        );
        if (pgn && pgn.trim().length > 5) {
            launchAnalysis(pgn.trim());
        }
    }

    // ───── PGN Extraction Pipeline ─────
    function extractPGN(): string | null {
        let pgn = extractFromGlobalObjects();
        if (pgn) { console.log('[LocalMax] PGN from Layer 1 (globals)'); return pgn; }

        pgn = extractFromDOM();
        if (pgn) { console.log('[LocalMax] PGN from Layer 2 (DOM)'); return pgn; }

        return null;
    }

    // ───── Launch Analysis ─────
    function launchAnalysis(pgn: string) {
        chrome.storage.session.set({
            analysisGame: pgn,
            sourceUrl: location.href,
            sourceSite: 'lichess.org',
            timestamp: Date.now(),
        }, () => {
            chrome.runtime.sendMessage({ type: 'OPEN_ANALYSIS_TAB' });
        });
    }

    function handleClick() {
        const pgn = extractPGN();
        if (pgn) {
            launchAnalysis(pgn);
        } else {
            promptManualPGN();
        }
    }

    // ───── Button Creation ─────
    function createButton(): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.innerHTML = '🔬 LocalMax Analysis';
        btn.title = 'Analyze with LocalMax (offline, unlimited depth)';

        Object.assign(btn.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'linear-gradient(135deg, #0A1428 0%, #142850 100%)',
            color: '#00F5FF',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'Inter, system-ui, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: '10000',
            marginLeft: '8px',
            boxShadow: '0 0 10px rgba(0, 245, 255, 0.1)',
        });

        btn.onmouseenter = () => {
            btn.style.background = 'linear-gradient(135deg, #142850 0%, #1A3264 100%)';
            btn.style.borderColor = 'rgba(0, 245, 255, 0.6)';
            btn.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2)';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'linear-gradient(135deg, #0A1428 0%, #142850 100%)';
            btn.style.borderColor = 'rgba(0, 245, 255, 0.3)';
            btn.style.boxShadow = '0 0 10px rgba(0, 245, 255, 0.1)';
        };

        btn.addEventListener('click', handleClick);
        return btn;
    }

    // ───── Injection Logic ─────
    function tryInject() {
        if (injected || document.getElementById(BUTTON_ID)) return;

        const targets = [
            '.analyse__controls',
            '.game__control',
            '.round__app .rcontrols',
            '.analyse__tools',
            '.game__meta',
        ];

        for (const selector of targets) {
            const container = document.querySelector(selector);
            if (container) {
                const btn = createButton();
                container.appendChild(btn);
                injected = true;
                console.log('[LocalMax] Lichess button injected into', selector);
                return;
            }
        }

        // Fallback: floating button if board detected
        if (document.querySelector('cg-board, .cg-wrap, .round__app, .analyse__board')) {
            const btn = createButton();
            Object.assign(btn.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '99999',
                boxShadow: '0 4px 20px rgba(0, 245, 255, 0.2), 0 2px 8px rgba(0,0,0,0.5)',
            });
            document.body.appendChild(btn);
            injected = true;
            console.log('[LocalMax] Lichess floating button injected');
        }
    }

    // ───── MutationObserver ─────
    const marker = document.createElement('div');
    marker.id = 'localmax-injected-lichess';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    const observer = new MutationObserver(() => {
        if (!injected) tryInject();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    setTimeout(tryInject, 1500);
    setTimeout(tryInject, 3500);
})();
