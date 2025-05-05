// lottery.js
import { lotteryData, prizeConfig } from './data.js';

class LotterySystem {
    constructor() {
        this.firstPrizes = [];    // 一等奖（包括特等奖）
        this.secondPrizes = [];   // 二等奖
        this.thirdPrizes = [];    // 三等奖
        this.currentDrawStage = 'third'; // 当前抽奖阶段：'third', 'second', 'first'
        this.drawnPrizes = [];
        this.currentPrize = null;
        
        // 添加批次追踪
        this.currentBatch = {
            third: 0,  // 三等奖当前批次
            second: 0, // 二等奖当前批次
            totalBatches: {
                third: 3,  // 三等奖总批次
                second: 3  // 二等奖总批次
            }
        };
        
        this.generateAllPrizes();
    }
    
    // 生成所有可能的奖品组合并分类
    generateAllPrizes() {
        // 创建所有可能的组合
        const allCombinations = [];
        
        // 只使用前三个星系 (A, B, C)
        const validWorlds = lotteryData.worlds.slice(0, 3);
        
        // 遍历每个世界、鲸鱼和星体创建组合
        validWorlds.forEach(world => {
            lotteryData.whales.forEach(whale => {
                lotteryData.celestialBodies.forEach(celestialBody => {
                    allCombinations.push({
                        world: world.id,
                        whale: whale.name,
                        celestialBody: celestialBody,
                        fullCode: `${world.id}-${whale.name}-${celestialBody}`
                    });
                });
            });
        });
        
        // 打乱组合
        this.shuffleArray(allCombinations);
        
        // 分配奖品到不同等级
        let index = 0;
        
        // 分配三等奖
        this.thirdPrizes = allCombinations.slice(index, index + prizeConfig.thirdPrize)
            .map(prize => ({ ...prize, prizeType: 'third' }));
        index += prizeConfig.thirdPrize;
        
        // 分配二等奖
        this.secondPrizes = allCombinations.slice(index, index + prizeConfig.secondPrize)
            .map(prize => ({ ...prize, prizeType: 'second' }));
        index += prizeConfig.secondPrize;
        
        // 分配一等奖和特等奖
        const firstPrizesTemp = allCombinations.slice(index, index + prizeConfig.firstPrize);
        
        // 最后一个设为特等奖，其余为一等奖
        this.firstPrizes = firstPrizesTemp.map((prize, i) => ({
            ...prize,
            prizeType: i === firstPrizesTemp.length - 1 ? 'first' : 'first'
        }));
    }
    
    // Fisher-Yates 洗牌算法
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // 获取当前阶段的所有奖品
    getCurrentStagePrizes() {
        switch (this.currentDrawStage) {
            case 'third': return this.thirdPrizes;
            case 'second': return this.secondPrizes;
            case 'first': return this.firstPrizes;
            default: return [];
        }
    }
    
    // 抽取一个奖品
    drawPrize() {
        // 如果当前阶段已经抽完，进入下一阶段
        if (this.getCurrentStagePrizes().length === 0) {
            if (this.currentDrawStage === 'third') {
                this.currentDrawStage = 'second';
                this.currentBatch.third = 0; // 重置批次
            } else if (this.currentDrawStage === 'second') {
                this.currentDrawStage = 'first';
                this.currentBatch.second = 0; // 重置批次
            } else {
                return null; // 所有奖品都抽完了
            }
        }
        
        // 获取当前阶段的奖品
        const prizes = this.getCurrentStagePrizes();
        
        if (prizes.length === 0) {
            return null; // 没有奖品可抽了
        }
        
        // 为不同阶段使用不同的抽奖逻辑
        if (this.currentDrawStage === 'first') {
            // 一等奖一个一个抽
            this.currentPrize = prizes.shift();
            this.drawnPrizes.push(this.currentPrize);
            return this.currentPrize;
        } else {
            // 二等奖和三等奖分批抽取
            const batchSize = this.currentDrawStage === 'second' ? 5 : 10; // 二等奖每批5个，三等奖每批10个
            const totalBatches = this.currentBatch.totalBatches[this.currentDrawStage];
            
            // 确定这一批的结束索引
            let endIndex = Math.min(batchSize, prizes.length);
            
            // 获取这一批的奖品
            const batchPrizes = prizes.splice(0, endIndex);
            this.drawnPrizes.push(...batchPrizes);
            
            // 增加当前批次计数
            this.currentBatch[this.currentDrawStage]++;
            
            // 取第一个作为主奖品用于动画
            this.currentPrize = batchPrizes[0];
            
            return {
                mainPrize: this.currentPrize,
                allPrizes: batchPrizes,
                prizeType: this.currentDrawStage,
                currentBatch: this.currentBatch[this.currentDrawStage],
                totalBatches: totalBatches
            };
        }
    }
    
    // 获取剩余奖品总数
    getRemainingCount() {
        return this.thirdPrizes.length + this.secondPrizes.length + this.firstPrizes.length;
    }
    
    // 获取当前抽奖阶段
    getCurrentStage() {
        return this.currentDrawStage;
    }
    
    // 获取当前阶段剩余奖品数
    getCurrentStageCount() {
        return this.getCurrentStagePrizes().length;
    }
}

export default LotterySystem;