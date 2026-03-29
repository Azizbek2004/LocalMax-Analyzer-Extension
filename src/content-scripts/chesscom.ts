/**
 * Chess.com Content Script
 * Detects game pages and injects the LocalMax Analysis button.
 * 3-Layer PGN extraction system.
 */

(function () {
    if (document.getElementById('localmax-injected')) return;

    const BUTTON_ID = 'localmax-analysis-btn';
    let injected = false;

    // ───── Layer 1: Global Objects ─────
    function extractFromGlobalObjects(): string | null {
        try {
            // Chess.com stores game data in various global objects
            const w = window as any;
            if (w.chesscom?.game?.pgn) return w.chesscom.game.pgn;
            if (w.chesscomGameData?.pgn) return w.chesscomGameData.pgn;

            // Try to find game controller with PGN
            const gc = w.document?.querySelector('.board-layout-main');
            if (gc) {
                const gameData = gc.__vue__?.game?.pgn || gc._reactInternalInstance?.pgn;
                if (gameData) return gameData;
            }
        } catch (e) {
            console.log('[LocalMax] Layer 1 failed:', e);
        }
        return null;
    }

    // ───── Layer 2: DOM Reconstruction ─────
    function extractFromDOM(): string | null {
        try {
            const moveElements = document.querySelectorAll(
                '.move-text-component, .move-text, [data-ply] .node, .main-line-ply'
            );

            if (moveElements.length === 0) return null;

            const moves: string[] = [];
            moveElements.forEach((el) => {
                const text = el.textContent?.trim();
                if (text && !text.match(/^\d+\.$/)) {
                    moves.push(text);
                }
            });

            if (moves.length < 2) return null;

            // Build PGN string from moves
            let pgn = '';
            for (let i = 0; i < moves.length; i++) {
                if (i % 2 === 0) {
                    pgn += `${Math.floor(i / 2) + 1}. `;
                }
                pgn += moves[i] + ' ';
            }

            // Try to get result
            const resultEl = document.querySelector('.result-text, .game-result');
            if (resultEl?.textContent) {
                pgn += resultEl.textContent.trim();
            }

            return pgn.trim();
        } catch (e) {
            console.log('[LocalMax] Layer 2 failed:', e);
        }
        return null;
    }

    // ───── Layer 3: Clipboard Fallback ─────
    function promptManualPGN(): void {
        const pgn = prompt(
            '🔬 LocalMax Analyzer\n\nCould not auto-extract the game.\n\n' +
            'Please paste your PGN here:\n' +
            '(Click "Share" → "Copy PGN" on Chess.com, then paste here)'
        );
        if (pgn && pgn.trim().length > 5) {
            launchAnalysis(pgn.trim());
        }
    }

    // ───── PGN Extraction Pipeline ─────
    function extractPGN(): string | null {
        // Try layers in order
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
            sourceSite: 'chess.com',
            timestamp: Date.now(),
        }, () => {
            chrome.runtime.sendMessage({ type: 'OPEN_ANALYSIS_TAB' });
        });
    }

    // ───── Button Click Handler ─────
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
        btn.title = 'Analyze this game with LocalMax (offline, unlimited depth)';

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

        // Look for action bars on Chess.com
        const targets = [
            '.game-review-buttons-component',
            '.game-action-buttons',
            '.share-menu-component',
            '.board-controls-bottom',
            '.game-buttons-component',
        ];

        for (const selector of targets) {
            const container = document.querySelector(selector);
            if (container) {
                const btn = createButton();
                container.appendChild(btn);
                injected = true;
                console.log('[LocalMax] Button injected into', selector);
                return;
            }
        }

        // Fallback: create floating button in bottom-right
        if (document.querySelector('.board-layout-main, .game-board-component, wc-chess-board')) {
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
            console.log('[LocalMax] Floating button injected');
        }
    }

    // ───── MutationObserver ─────
    const marker = document.createElement('div');
    marker.id = 'localmax-injected';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    const observer = new MutationObserver(() => {
        if (!injected) tryInject();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Initial attempt
    setTimeout(tryInject, 1500);
    setTimeout(tryInject, 3500);
})();
