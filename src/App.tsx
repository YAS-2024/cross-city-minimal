import { useState, useEffect, useRef } from 'react';
import { GameMaster } from './logic/GameMaster';
import { AIUtils } from './logic/AIUtils';
import type { AIDifficulty } from './logic/AIUtils'; // ★修正: 型としてインポート
import { GAME_CONFIG } from './config';
import { CARD_MASTER_DATA } from './data/cards';
import { RuleModal } from './components/RuleModal';
import type { CardData, CardEntity, Position, ActionResult } from './types';
import './App.css';


const ARROW_SYMBOLS: Record<string, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };
const formatArrows = (arrows: string[]) => arrows.map(dir => ARROW_SYMBOLS[dir] || dir).join("");

function App() {
  const gmRef = useRef<GameMaster | null>(null);
  const [showRules, setShowRules] = useState(false);
  // --- State ---
  const [gameMode, setGameMode] = useState<'PvP' | 'PvC' | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('NORMAL');

  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [hand, setHand] = useState<CardEntity[]>([]);
  const [boardCards, setBoardCards] = useState<{ pos: Position; card: CardEntity }[]>([]);
  const [deckCount, setDeckCount] = useState(0);
  const [topDiscard, setTopDiscard] = useState<CardEntity | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // 詳細表示用
  const [inspectCard, setInspectCard] = useState<CardData | null>(null);

  const [stats, setStats] = useState({
    Player1: { p1: 0, p2: 0, budget: 0 },
    Player2: { p1: 0, p2: 0, budget: 0 }
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFinalRound, setIsFinalRound] = useState(false);

  // --- ゲーム開始・初期化 ---
  const startGame = (mode: 'PvP' | 'PvC', difficulty: AIDifficulty = 'NORMAL') => {
    setGameMode(mode);
    setAiDifficulty(difficulty);

    const gm = new GameMaster(CARD_MASTER_DATA); 
    gm.addPlayer("Player1");
    gm.addPlayer("Player2");
    
    // 初期配置（役場）
    const townHallData = CARD_MASTER_DATA.find(c => c.category === 'TOWN_HALL')!;
    gm.board.placeCard({ instanceId: "p1_hall", ownerId: "Player1", data: townHallData }, { x: 0, y: 1 });
    gm.board.placeCard({ instanceId: "p2_hall", ownerId: "Player2", data: townHallData }, { x: -1, y: -1 });

    gm.startGame();
    gmRef.current = gm;
    
    setLogs([]);
    const modeLabel = mode === 'PvP' ? '対人戦' : `CPU戦 (難易度: ${difficulty})`;
    addLog(`ゲーム開始！ モード: ${modeLabel}`);
    
    syncState();
  };

  // --- CPU思考ループ ---
  useEffect(() => {
    if (gameMode === 'PvC' && currentPlayerId === 'Player2' && !gameWinner && !isAiThinking) {
      runCpuTurn();
    }
  }, [currentPlayerId, gameMode, gameWinner]);

  const runCpuTurn = async () => {
    if (!gmRef.current) return;
    setIsAiThinking(true);
    
    // 思考中演出
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // AI思考 (難易度を渡す)
    const move = await AIUtils.getBestMove(gmRef.current, 'Player2', aiDifficulty);
    
    if (move) {
      const result = gmRef.current.playCard('Player2', move.cardInstanceId, move.pos);
      showSystemMessage(result);
    } else {
      // 最善手が見つからない場合は手札を捨てる
      const p2Hand = gmRef.current.players.get('Player2')?.getHand() || [];
      if (p2Hand.length > 0) {
        const discardCard = p2Hand[0];
        // ★修正: 結果を変数で受け取らず直接実行（未使用警告対策）
        gmRef.current.discardFromHand('Player2', discardCard.instanceId);
        addLog(`(CPU) 予算確保のため ${discardCard.data.name} を破棄しました`);
      } else {
        addLog("(CPU) 行動できませんでした。");
      }
    }
    
    syncState();
    await new Promise(resolve => setTimeout(resolve, 800));
    
    handleEndTurn();
    setIsAiThinking(false);
  };

  // --- ヘルパーメソッド ---
  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

  const showSystemMessage = (result: ActionResult) => {
    if (result.success) {
      addLog(result.message);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const syncState = () => {
    if (!gmRef.current) return;
    const gm = gmRef.current;
    const pid = gm.getCurrentPlayerId();
    const player = gm.players.get(pid);
    
    setCurrentPlayerId(pid);
    setDeckCount(gm.deck.length);
    setTopDiscard(gm.discardPile.length > 0 ? gm.discardPile[gm.discardPile.length - 1] : null);
    setBoardCards(gm.board.getAllCards());
    setGameWinner(gm.winner);
    setIsFinalRound(gm.isFinalRound);

    if (pid === 'Player1') {
      if (player) setHand(player.getHand());
    } else {
      if (gameMode === 'PvC' && pid === 'Player2') {
         // CPU戦相手ターン: 自分の手札を表示したままにする
         const p1 = gm.players.get('Player1');
         if(p1) setHand(p1.getHand());
      } else {
        // 対人戦相手ターン: 相手の手札を表示
        if (player) setHand(player.getHand());
      }
    }
    setStats({
      Player1: gm.getPlayerStats("Player1"),
      Player2: gm.getPlayerStats("Player2")
    });
  };

  const getGuideMessage = () => {
    if (gameWinner) return "決着！";
    if (gameMode === 'PvC' && currentPlayerId === 'Player2') return `CPU(${aiDifficulty})が思考中...`;
    const budget = stats[currentPlayerId as keyof typeof stats]?.budget || 0;
    const finalMsg = isFinalRound ? "【ファイナルラウンド】 " : "";
    return `${finalMsg}${currentPlayerId}の番です。コスト ${budget} までの建物を建設できます。`;
  };

  // --- イベントハンドラ ---

  const handlePlaceCard = (x: number, y: number) => {
    const placed = boardCards.find(c => c.pos.x === x && c.pos.y === y);
    if (placed) {
      setInspectCard(placed.card.data);
      return; 
    }

    if (gameWinner || (gameMode === 'PvC' && currentPlayerId === 'Player2')) return;
    if (!selectedCardId || !gmRef.current) return;

    const result = gmRef.current.playCard(currentPlayerId, selectedCardId, { x, y });
    showSystemMessage(result);
    
    if (result.success) {
      setSelectedCardId(null);
      setInspectCard(null); 
      syncState();
    }
  };

  const handleHandClick = (card: CardEntity) => {
    if (gameWinner) return;
    if (gameMode === 'PvC' && currentPlayerId === 'Player2') return;

    setSelectedCardId(card.instanceId);
    setInspectCard(card.data); 
  };

  const handleEndTurn = () => {
    if (!gmRef.current) return;
    const result = gmRef.current.nextTurn();
    if (result.success && result.message) addLog(result.message);
    if (gmRef.current.winner) addLog(`勝者決定: ${gmRef.current.winner}`);
    setErrorMsg(null);
    setSelectedCardId(null);
    setInspectCard(null);
    syncState();
  };

  const handleDiscard = () => {
    if (gameWinner || (gameMode === 'PvC' && currentPlayerId === 'Player2')) return;
    if (!selectedCardId || !gmRef.current) return;
    const result = gmRef.current.discardFromHand(currentPlayerId, selectedCardId);
    showSystemMessage(result);
    if (result.success) {
      setSelectedCardId(null);
      setInspectCard(null);
      syncState();
    }
  };

  // --- サブコンポーネント: カード表示 ---
  const CardView = ({ data }: { data: CardData, ownerId?: string }) => {
    const bgStyle = data.image 
      ? { 
          backgroundImage: `url(/images/${data.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } 
      : {};

    return (
      <div 
        className={`card-text-view category-${data.category}`} 
        style={bgStyle}
      >
        <div className="card-content-overlay">
          <div className="card-name">{data.name}</div>
          <div className="card-stats-row">
            👤{data.stats.p1} ⚡{data.stats.p2} 💰{data.stats.tax}
          </div>
          <div className="card-arrow-overlay">
            {formatArrows(data.arrows)}
          </div>
        </div>

        {data.effects && data.effects.length > 0 && (
          <div 
            style={{
              position: 'absolute', top: 2, right: 2, 
              color: 'gold', fontSize: '10px', textShadow: '1px 1px 0 #000',
              zIndex: 3
            }}
          >
            ★
          </div>
        )}
      </div>
    );
  };

  // --- グリッド描画 ---
// --- グリッド描画 ---
  const renderGrid = () => {
    const grid = [];
    const { X_MIN, X_MAX, Y_MIN, Y_MAX } = GAME_CONFIG.BOARD;

    // ★追加: 選択中のカードがあれば、そのコストと配置可能判定の準備をする
    let selectedCardData: CardEntity | undefined;
    if (selectedCardId && gmRef.current) {
      // プレイヤーの手札から探す（自分の手番のみ）
      if (currentPlayerId === 'Player1') { // 自分の手番だけハイライト
         const player = gmRef.current.players.get('Player1');
         selectedCardData = player?.getHand().find(c => c.instanceId === selectedCardId);
      }
    }
    
    // 現在の予算（配置判定用）
    const currentBudget = stats[currentPlayerId as keyof typeof stats]?.budget || 0;

    for (let y = Y_MIN; y <= Y_MAX; y++) {
      for (let x = X_MIN; x <= X_MAX; x++) {
        const placed = boardCards.find(c => c.pos.x === x && c.pos.y === y);
        
        // ★追加: ハイライト判定
        let highlightClass = "";
        if (selectedCardData && !placed && gmRef.current) {
          // RuleEngineを使って配置可能かチェック
          // ※ここで全マス判定するのは計算量的に軽微(5x6=30回)なので問題なし
          const check = gmRef.current.ruleEngine.canPlaceCard(
            currentPlayerId, 
            { x, y }, 
            currentBudget, 
            selectedCardData.data.cost
          );
          
          if (check.valid) {
            highlightClass = "highlight-valid";
          }
        }

        grid.push(
          <div 
            key={`${x},${y}`} 
            className={`grid-cell ${highlightClass}`} // ★クラス適用
            onClick={() => handlePlaceCard(x, y)}
          >
            {placed ? (
              <div className={`card-wrapper owner-${placed.card.ownerId}`}>
                 <CardView data={placed.card.data} ownerId={placed.card.ownerId} />
              </div>
            ) : <div className="empty-cell" />}
          </div>
        );
      }
    }
    return grid;
  };

// --- タイトル画面 ---
  if (!gameMode) {
    return (
      <div className="start-screen">
        <div className="title-logo">Cross-City</div>
        
        <div className="title-menu-container">
          {/* PvP ボタン */}
          <button className="btn-primary-mode" onClick={() => startGame('PvP')}>
            二人で対戦 (PvP)
          </button>
          
          {/* PvC セクション */}
          <div className="cpu-mode-section">
            <div className="section-label">コンピュータと対戦 (PvC)</div>
            <div className="difficulty-row">
              <button className="btn-level level-easy" onClick={() => startGame('PvC', 'EASY')}>弱い</button>
              <button className="btn-level level-normal" onClick={() => startGame('PvC', 'NORMAL')}>普通</button>
              <button className="btn-level level-hard" onClick={() => startGame('PvC', 'HARD')}>強い</button>
            </div>
          </div>

          {/* ルール説明ボタン */}
          <button className="btn-rules" onClick={() => setShowRules(true)}>
            📖 ルール説明
          </button>
        </div>

        <div className="copyright">© 2024 Cross-City Project</div>

        {/* ルールモーダル */}
        <RuleModal show={showRules} onClose={() => setShowRules(false)} />
      </div>
    );
  }

  const p1Score = Math.min(stats.Player1.p1, stats.Player1.p2);
  const p2Score = Math.min(stats.Player2.p1, stats.Player2.p2);
  
  const boardCols = GAME_CONFIG.BOARD.COLS;
  const boardRows = GAME_CONFIG.BOARD.ROWS;

  // --- メイン画面 ---
  return (
    <div className="container">
      <div className="header">
        <div className={`status-box ${currentPlayerId === 'Player2' ? 'active' : ''}`}>
          P2 ({gameMode === 'PvC' ? 'CPU' : '相手'}): 👤{stats.Player2.p1} ⚡{stats.Player2.p2} 💰{stats.Player2.budget}
        </div>
        <div className="deck-info">山札: {deckCount} | 捨札: {topDiscard ? topDiscard.data.name : "-"}</div>
        <div className={`status-box ${currentPlayerId === 'Player1' ? 'active' : ''}`}>
          P1 (あなた): 👤{stats.Player1.p1} ⚡{stats.Player1.p2} 💰{stats.Player1.budget}
        </div>
      </div>

      <div className="message-area">
        {errorMsg ? <div className="error-message">⚠️ {errorMsg}</div> : <div className="guide-message">ℹ️ {getGuideMessage()}</div>}
      </div>

      <div className="main-area">
        <div 
          className="board-area" 
          style={{ 
            gridTemplateColumns: `repeat(${boardCols}, 60px)`, 
            gridTemplateRows: `repeat(${boardRows}, 60px)` 
          }}
        >
          {renderGrid()}
        </div>
      </div>

      {/* インフォメーションパネル */}
      <div className="info-panel">
        {inspectCard ? (
          <div className="info-content">
            <div className="info-header">
              <span className="info-name">{inspectCard.name}</span>
              <span className={`info-badge category-${inspectCard.category}`}>
                コスト: {inspectCard.cost}
              </span>
            </div>
            <div className="info-stats">
              人口👤: {inspectCard.stats.p1} / インフラ⚡: {inspectCard.stats.p2} / 税収💰: {inspectCard.stats.tax}
            </div>
            <div className="info-effect">
              {inspectCard.effects && inspectCard.effects.length > 0 
                ? inspectCard.effects.map(e => e.description).join('\n')
                : "効果なし"
              }
            </div>
          </div>
        ) : (
          <div className="info-placeholder">カードを選択すると詳細が表示されます</div>
        )}
      </div>

      <div className="log-container">
        <div className="log-title">ログ</div>
        <div className="log-list">{logs.map((l, i) => <div key={i} className="log-item">{l}</div>)}</div>
      </div>

      <div className="control-area">
        {gameWinner ? (
          <button className="btn-title" onClick={() => setGameMode(null)}>タイトルに戻る</button>
        ) : (
          <>
            <button onClick={handleEndTurn} disabled={gameMode === 'PvC' && currentPlayerId === 'Player2'}>ターン終了</button>
            <button onClick={handleDiscard} disabled={!selectedCardId || (gameMode === 'PvC' && currentPlayerId === 'Player2')}>捨てて+{GAME_CONFIG.ECONOMY.DISCARD_BONUS}金</button>
          </>
        )}
      </div>

      {gameWinner && (
        <div className="result-overlay">
           <div className="result-box">
              <h2 className="result-title">ゲーム終了！</h2>
              <div className="result-winner">勝者: <span className="winner-name">{gameWinner === 'DRAW' ? '引き分け' : gameWinner}</span></div>
              <div className="result-detail">
                <div className={gameWinner === 'Player1' ? 'winner-text' : ''}>Player1 都市人口: <strong>{p1Score}</strong> (👤{stats.Player1.p1}, ⚡{stats.Player1.p2})</div>
                <div className={gameWinner === 'Player2' ? 'winner-text' : ''}>Player2 都市人口: <strong>{p2Score}</strong> (👤{stats.Player2.p1}, ⚡{stats.Player2.p2})</div>
              </div>
              <p className="result-note">※都市人口 = 人口とインフラの低い方の値</p>
           </div>
        </div>
      )}

      {/* 手札エリア */}
      <div className="hand-area">
        {hand.map(card => (
          <div 
            key={card.instanceId} 
            className={`hand-card ${selectedCardId === card.instanceId ? 'selected' : ''}`}
            onClick={() => handleHandClick(card)}
          >
            <CardView data={card.data} />
            <div className="hand-cost-badge">{card.data.cost}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;