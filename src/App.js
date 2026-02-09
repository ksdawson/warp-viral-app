import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import './App.css';

export default function StartupRunwayGame() {
  const [gameState, setGameState] = useState({
    cash: 2000000, // $2M starting cash
    headcount: 5,
    valuation: 5000000, // $5M
    monthlyRevenue: 50000,
    monthlyExpenses: 75000, // Start cash-negative
    month: 0,
    gameOver: false,
    won: false
  });

  const [currentChoices, setCurrentChoices] = useState([]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [notification, setNotification] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [cooldowns, setCooldowns] = useState({}); // Track cooldowns for each choice type

  const CHOICE_TIME = 5; // seconds to make a choice
  const GAME_SPEED = 1000; // 1 second = 1 game tick

  const addLog = (message, type = 'info') => {
    setGameLog(prev => [{ message, type, time: Date.now() }, ...prev].slice(0, 5));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const hiringChoices = [
    {
      id: 'sf_engineer',
      title: "Hire 10x Engineer (SF)",
      cost: 500000,
      headcount: 1,
      revenueBoost: { min: 10000, max: 80000, probability: 0.45 },
      valuationBoost: { multiplier: 1.15, probability: 0.35 },
      monthlyExpenseDelta: 42000,
      cooldown: 3
    },
    {
      id: 'nyc_interns',
      title: "Hire 10 NYC Interns",
      cost: 100000,
      headcount: 10,
      revenueBoost: { min: 2000, max: 20000, probability: 0.3 },
      valuationBoost: { multiplier: 1.03, probability: 0.2 },
      monthlyExpenseDelta: 15000,
      cooldown: 2
    },
    {
      id: 'sales_lead',
      title: "Hire Senior Sales Lead",
      cost: 300000,
      headcount: 1,
      revenueBoost: { min: 40000, max: 120000, probability: 0.55 },
      valuationBoost: { multiplier: 1.12, probability: 0.45 },
      monthlyExpenseDelta: 25000,
      cooldown: 3
    },
    {
      id: 'offshore_team',
      title: "Hire Offshore Dev Team",
      cost: 150000,
      headcount: 5,
      revenueBoost: { min: 5000, max: 30000, probability: 0.4 },
      valuationBoost: { multiplier: 1.05, probability: 0.3 },
      monthlyExpenseDelta: 12000,
      cooldown: 2
    },
    {
      id: 'growth_marketer',
      title: "Hire Growth Marketer",
      cost: 250000,
      headcount: 1,
      revenueBoost: { min: 20000, max: 60000, probability: 0.5 },
      valuationBoost: { multiplier: 1.08, probability: 0.4 },
      monthlyExpenseDelta: 20000,
      cooldown: 2
    },
    {
      id: 'layoffs',
      title: "Fire 20% of Team",
      cost: -100000,
      headcount: -Math.max(1, Math.floor(gameState.headcount * 0.2)),
      revenueBoost: { min: -30000, max: -10000, probability: 0.8 },
      valuationBoost: { multiplier: 0.85, probability: 0.7 },
      monthlyExpenseDelta: -15000,
      cooldown: 4
    },
    {
      id: 'vp_eng',
      title: "Hire VP of Engineering",
      cost: 400000,
      headcount: 1,
      revenueBoost: { min: 10000, max: 50000, probability: 0.4 },
      valuationBoost: { multiplier: 1.15, probability: 0.5 },
      monthlyExpenseDelta: 35000,
      cooldown: 4
    },
    {
      id: 'contractors',
      title: "Hire Part-time Contractors",
      cost: 80000,
      headcount: 3,
      revenueBoost: { min: 5000, max: 20000, probability: 0.35 },
      valuationBoost: { multiplier: 1.02, probability: 0.25 },
      monthlyExpenseDelta: 8000,
      cooldown: 1
    },
    {
      id: 'cto',
      title: "Hire CTO",
      cost: 600000,
      headcount: 1,
      revenueBoost: { min: 15000, max: 70000, probability: 0.5 },
      valuationBoost: { multiplier: 1.25, probability: 0.55 },
      monthlyExpenseDelta: 50000,
      cooldown: 5
    },
    {
      id: 'customer_success',
      title: "Hire Customer Success Team",
      cost: 200000,
      headcount: 4,
      revenueBoost: { min: 25000, max: 70000, probability: 0.6 },
      valuationBoost: { multiplier: 1.06, probability: 0.35 },
      monthlyExpenseDelta: 18000,
      cooldown: 2
    },
    {
      id: 'product_manager',
      title: "Hire Senior Product Manager",
      cost: 350000,
      headcount: 1,
      revenueBoost: { min: 15000, max: 50000, probability: 0.45 },
      valuationBoost: { multiplier: 1.1, probability: 0.4 },
      monthlyExpenseDelta: 28000,
      cooldown: 3
    },
    {
      id: 'data_scientist',
      title: "Hire Data Science Team",
      cost: 450000,
      headcount: 3,
      revenueBoost: { min: 10000, max: 60000, probability: 0.4 },
      valuationBoost: { multiplier: 1.12, probability: 0.45 },
      monthlyExpenseDelta: 38000,
      cooldown: 3
    },
    {
      id: 'junior_devs',
      title: "Hire 5 Junior Developers",
      cost: 180000,
      headcount: 5,
      revenueBoost: { min: 5000, max: 35000, probability: 0.35 },
      valuationBoost: { multiplier: 1.04, probability: 0.25 },
      monthlyExpenseDelta: 22000,
      cooldown: 2
    },
    {
      id: 'head_sales',
      title: "Hire Head of Sales",
      cost: 450000,
      headcount: 1,
      revenueBoost: { min: 60000, max: 150000, probability: 0.6 },
      valuationBoost: { multiplier: 1.18, probability: 0.5 },
      monthlyExpenseDelta: 38000,
      cooldown: 4
    },
    {
      id: 'designer',
      title: "Hire Lead Designer",
      cost: 220000,
      headcount: 1,
      revenueBoost: { min: 8000, max: 35000, probability: 0.35 },
      valuationBoost: { multiplier: 1.07, probability: 0.3 },
      monthlyExpenseDelta: 18000,
      cooldown: 2
    },
    {
      id: 'qa_team',
      title: "Hire QA Testing Team",
      cost: 160000,
      headcount: 4,
      revenueBoost: { min: 5000, max: 25000, probability: 0.3 },
      valuationBoost: { multiplier: 1.04, probability: 0.25 },
      monthlyExpenseDelta: 16000,
      cooldown: 2
    },
    {
      id: 'devops',
      title: "Hire DevOps Engineer",
      cost: 320000,
      headcount: 1,
      revenueBoost: { min: 8000, max: 40000, probability: 0.35 },
      valuationBoost: { multiplier: 1.06, probability: 0.3 },
      monthlyExpenseDelta: 26000,
      cooldown: 3
    },
    {
      id: 'freelancers',
      title: "Hire Remote Freelancers",
      cost: 60000,
      headcount: 5,
      revenueBoost: { min: 3000, max: 18000, probability: 0.3 },
      valuationBoost: { multiplier: 1.01, probability: 0.2 },
      monthlyExpenseDelta: 6000,
      cooldown: 1
    },
    {
      id: 'do_nothing',
      title: "Do Nothing This Month",
      cost: 0,
      headcount: 0,
      revenueBoost: { min: 0, max: 0, probability: 0 },
      valuationBoost: { multiplier: 1, probability: 0 },
      monthlyExpenseDelta: 0,
      cooldown: 0
    }
  ];

  const generateChoices = useCallback(() => {
    // Filter out choices that are on cooldown
    const available = hiringChoices.filter(choice => !cooldowns[choice.id] || cooldowns[choice.id] <= 0);
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [cooldowns, gameState.headcount]);

  const applyChoice = (choice) => {
    if (gameState.cash < choice.cost && choice.cost > 0) {
      showNotification("Not enough cash for this hire!", 'error');
      return;
    }

    let newState = { ...gameState };
    newState.cash -= choice.cost;
    newState.headcount = Math.max(1, newState.headcount + choice.headcount);
    newState.monthlyExpenses += choice.monthlyExpenseDelta;

    // Revenue boost
    if (Math.random() < choice.revenueBoost.probability) {
      const boost = Math.floor(
        Math.random() * (choice.revenueBoost.max - choice.revenueBoost.min) + 
        choice.revenueBoost.min
      );
      newState.monthlyRevenue += boost;
      if (boost > 0) {
        addLog(`Revenue increased by $${boost.toLocaleString()}/mo!`, 'success');
      } else if (boost < 0) {
        addLog(`Revenue decreased by $${Math.abs(boost).toLocaleString()}/mo`, 'warning');
      }
    }

    // Valuation boost
    if (Math.random() < choice.valuationBoost.probability) {
      newState.valuation = Math.floor(newState.valuation * choice.valuationBoost.multiplier);
      if (choice.valuationBoost.multiplier > 1) {
        addLog(`Valuation increased to $${(newState.valuation / 1000000).toFixed(1)}M!`, 'success');
      }
    }

    addLog(`${choice.title} - Team now ${newState.headcount} people`, 'info');
    
    // Set cooldown for this choice
    if (choice.cooldown > 0) {
      setCooldowns(prev => ({
        ...prev,
        [choice.id]: choice.cooldown
      }));
    }

    setGameState(newState);
    setTimeLeft(CHOICE_TIME);
    setCurrentChoices(generateChoices());
  };

  const processMonth = useCallback(() => {
    setGameState(prev => {
      let newState = { ...prev };
      newState.month += 1;

      // Monthly cash flow
      const netCashFlow = newState.monthlyRevenue - newState.monthlyExpenses;
      newState.cash += netCashFlow;

      // Random events (20% chance per month)
      if (Math.random() < 0.2) {
        const events = [
          {
            message: "Major client signed!",
            revenueChange: Math.floor(Math.random() * 50000) + 30000,
            type: 'success'
          },
          {
            message: "Unexpected expenses from server costs",
            expenseChange: Math.floor(Math.random() * 10000) + 5000,
            type: 'warning'
          },
          {
            message: "Lost a client to competitor",
            revenueChange: -Math.floor(Math.random() * 20000) - 10000,
            type: 'error'
          },
          {
            message: "VC interest! Valuation up!",
            valuationMultiplier: 1.3,
            type: 'success'
          },
          {
            message: "Key employee quit",
            headcountChange: -1,
            expenseChange: -15000,
            type: 'warning'
          }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        
        if (event.revenueChange) {
          newState.monthlyRevenue = Math.max(0, newState.monthlyRevenue + event.revenueChange);
        }
        if (event.expenseChange) {
          newState.monthlyExpenses += event.expenseChange;
        }
        if (event.valuationMultiplier) {
          newState.valuation = Math.floor(newState.valuation * event.valuationMultiplier);
        }
        if (event.headcountChange) {
          newState.headcount = Math.max(1, newState.headcount + event.headcountChange);
        }

        addLog(event.message, event.type);
        showNotification(event.message, event.type);
      }

      // Gradual expense increases (2% chance of 5-10% increase)
      if (Math.random() < 0.02) {
        const increase = Math.floor(newState.monthlyExpenses * (0.05 + Math.random() * 0.05));
        newState.monthlyExpenses += increase;
        addLog(`Operating costs increased by $${increase.toLocaleString()}/mo`, 'warning');
      }

      // Win condition
      if (newState.valuation >= 1000000000) {
        newState.gameOver = true;
        newState.won = true;
        addLog("🎉 UNICORN! You hit $1B valuation!", 'success');
      }

      // Lose condition
      if (newState.cash <= 0) {
        newState.gameOver = true;
        newState.won = false;
        addLog("💀 Out of cash! Game over.", 'error');
      }

      return newState;
    });

    // Decrement cooldowns
    setCooldowns(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (updated[key] > 0) {
          updated[key] -= 1;
        }
      });
      return updated;
    });

    // Generate new choices when month processes (timer expired with no action)
    setCurrentChoices(generateChoices());
  }, [generateChoices]);

  // Initialize game
  useEffect(() => {
    setCurrentChoices(generateChoices());
  }, [generateChoices]);

  // Game loop
  useEffect(() => {
    if (gameState.gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          processMonth();
          return CHOICE_TIME;
        }
        return prev - 1;
      });
    }, GAME_SPEED);

    return () => clearInterval(timer);
  }, [gameState.gameOver, processMonth]);

  const formatMoney = (amount) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const cashRunwayMonths = gameState.monthlyExpenses > gameState.monthlyRevenue
    ? Math.floor(gameState.cash / (gameState.monthlyExpenses - gameState.monthlyRevenue))
    : '∞';

  const resetGame = () => {
    setGameState({
      cash: 2000000,
      headcount: 5,
      valuation: 5000000,
      monthlyRevenue: 50000,
      monthlyExpenses: 75000,
      month: 0,
      gameOver: false,
      won: false
    });
    setCooldowns({});
    setCurrentChoices(generateChoices());
    setTimeLeft(CHOICE_TIME);
    setGameLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Startup Runway Simulator
          </h1>
          <p className="text-slate-400">Month {gameState.month} • Runway: {cashRunwayMonths} months</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-500/20 border border-green-500' :
            notification.type === 'error' ? 'bg-red-500/20 border border-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500' :
            'bg-blue-500/20 border border-blue-500'
          }`}>
            <p className="text-center font-semibold">{notification.message}</p>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left: Team */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-400" />
              <h3 className="text-lg font-semibold">Team</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-sm">Headcount</p>
                <p className="text-3xl font-bold">{gameState.headcount}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Valuation</p>
                <p className="text-2xl font-bold text-purple-400">{formatMoney(gameState.valuation)}</p>
              </div>
            </div>
          </div>

          {/* Center: Cash Runway */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-green-400" />
              <h3 className="text-lg font-semibold">Cash on Hand</h3>
            </div>
            <p className="text-3xl font-bold mb-4">{formatMoney(gameState.cash)}</p>
            
            {/* Cash Bar */}
            <div className="relative h-32 bg-slate-700 rounded-lg overflow-hidden">
              <div 
                className={`absolute bottom-0 w-full transition-all duration-500 ${
                  gameState.cash > 1000000 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                  gameState.cash > 500000 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                  'bg-gradient-to-t from-red-500 to-red-400'
                }`}
                style={{ height: `${Math.min(100, (gameState.cash / 3000000) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-lg font-bold drop-shadow-lg z-10">
                  {((gameState.cash / 3000000) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Right: Finances */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Monthly Finances</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-green-400">{formatMoney(gameState.monthlyRevenue)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Expenses</p>
                <p className="text-2xl font-bold text-red-400">{formatMoney(gameState.monthlyExpenses)}</p>
              </div>
              <div className="pt-2 border-t border-slate-600">
                <p className="text-slate-400 text-sm">Net Monthly</p>
                <p className={`text-xl font-bold ${
                  gameState.monthlyRevenue - gameState.monthlyExpenses >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatMoney(gameState.monthlyRevenue - gameState.monthlyExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Log */}
        {gameLog.length > 0 && (
          <div className="mb-6 bg-slate-800/30 backdrop-blur rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold mb-2 text-slate-400">Recent Events</h3>
            <div className="space-y-1">
              {gameLog.map((log, i) => (
                <p key={log.time} className={`text-sm ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-slate-300'
                }`}>
                  {log.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Hiring Decisions */}
        {!gameState.gameOver && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Make a Decision</h3>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-bold">{timeLeft}s</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {currentChoices.map((choice, idx) => {
                const isOnCooldown = cooldowns[choice.id] && cooldowns[choice.id] > 0;
                const cantAfford = choice.cost > gameState.cash && choice.cost > 0;
                
                return (
                  <button
                    key={idx}
                    onClick={() => applyChoice(choice)}
                    disabled={cantAfford || isOnCooldown}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      cantAfford || isOnCooldown
                        ? 'bg-slate-700/30 border-slate-600 opacity-50 cursor-not-allowed'
                        : 'bg-slate-700/50 border-slate-600 hover:border-purple-500 hover:bg-slate-700 cursor-pointer transform hover:scale-105'
                    }`}
                  >
                    <h4 className="font-bold mb-2">{choice.title}</h4>
                    {isOnCooldown && (
                      <div className="text-xs text-yellow-400 mb-2">
                        Cooldown: {cooldowns[choice.id]} months
                      </div>
                    )}
                    <div className="text-sm space-y-1 text-slate-300">
                      <p>Cost: <span className={choice.cost >= 0 ? 'text-red-400' : 'text-green-400'}>
                        {formatMoney(Math.abs(choice.cost))}
                      </span></p>
                      <p>Team: <span className={choice.headcount >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {choice.headcount >= 0 ? '+' : ''}{choice.headcount}
                      </span></p>
                      <p>Monthly: <span className={choice.monthlyExpenseDelta >= 0 ? 'text-red-400' : 'text-green-400'}>
                        {choice.monthlyExpenseDelta >= 0 ? '+' : ''}{formatMoney(Math.abs(choice.monthlyExpenseDelta))}
                      </span></p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 max-w-2xl w-full text-center border-2 border-purple-500 shadow-2xl">
              <h2 className="text-5xl font-bold mb-6">
                {gameState.won ? '🎉 Unicorn Status Achieved!' : '💀 Game Over'}
              </h2>
              
              <div className="mb-6">
                <p className="text-2xl mb-4">
                  {gameState.won 
                    ? `You built a ${formatMoney(gameState.valuation)} company in ${gameState.month} months!`
                    : `Ran out of cash after ${gameState.month} months.`
                  }
                </p>
                
                {gameState.won ? (
                  <p className="text-lg text-green-400 italic mb-4">
                    "Success isn't just about growth—it's about sustainable, strategic team building."
                  </p>
                ) : (
                  <p className="text-lg text-yellow-400 italic mb-4">
                    "Even the best ideas fail without disciplined financial management and strategic hiring."
                  </p>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-lg p-6 mb-6 text-left">
                <p className="text-sm text-slate-400 mb-3 font-semibold">Final Stats:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Team Size</p>
                    <p className="text-xl font-bold">{gameState.headcount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Valuation</p>
                    <p className="text-xl font-bold text-purple-400">{formatMoney(gameState.valuation)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Monthly Revenue</p>
                    <p className="text-xl font-bold text-green-400">{formatMoney(gameState.monthlyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Cash Remaining</p>
                    <p className={`text-xl font-bold ${gameState.cash > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatMoney(Math.max(0, gameState.cash))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-lg p-6 mb-6">
                <p className="text-lg mb-4 font-semibold">
                  Just like managing a startup, great tools make all the difference.
                </p>
                <p className="text-slate-300 mb-4">
                  Warp helps developers build faster with AI-powered workflows, intelligent completions, and seamless collaboration.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://www.joinwarp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Learn More About Warp →
                  </a>
                  <a
                    href="http://warp-app-123.s3-website-us-east-1.amazonaws.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Try Warp Demo →
                  </a>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 w-full sm:w-auto"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}