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
                // 如果是first阶段且抽完了，生成新的一等奖
                if (this.currentDrawStage === 'first') {
                    return this.generateAdditionalFirstPrize();
                }
                return null; // 其他情况返回null
            }
        }
        
        // 获取当前阶段的奖品
        const prizes = this.getCurrentStagePrizes();
        
        if (prizes.length === 0 && this.currentDrawStage === 'first') {
            // 如果是first阶段且抽完了，生成额外的一等奖
            return this.generateAdditionalFirstPrize();
        } else if (prizes.length === 0) {
            return null; // 其他阶段没有奖品就返回null
        }
        
        // 为不同阶段使用不同的抽奖逻辑
        if (this.currentDrawStage === 'first') {
            // 修改这里：使用generateAdditionalFirstPrize方法
            // 直接生成随机奖品，而不是使用奖池中的第一个
            return this.generateAdditionalFirstPrize();
        } else {
            // 二等奖和三等奖逻辑保持不变
            const batchSize = this.currentDrawStage === 'second' ? 5 : 10;
            const totalBatches = this.currentBatch.totalBatches[this.currentDrawStage];
            
            let endIndex = Math.min(batchSize, prizes.length);
            const batchPrizes = prizes.splice(0, endIndex);
            this.drawnPrizes.push(...batchPrizes);
            
            this.currentBatch[this.currentDrawStage]++;
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
    
    // 添加生成额外一等奖的方法
    generateAdditionalFirstPrize() {
        const extraDrawCount = this.firstPrizeDrawCount || 0; // Use 0 instead of this.firstPrizes.length
        this.firstPrizeDrawCount = extraDrawCount + 1;
        
        // 随机选择一个世界/星系
        const worldIndex = Math.floor(Math.random() * 3);
        const worldId = lotteryData.worlds[worldIndex].id;
        
        // 随机选择一个鲸鱼
        const whaleIndex = Math.floor(Math.random() * lotteryData.whales.length);
        const whaleName = lotteryData.whales[whaleIndex].name;
        
        // 随机选择一个星体编号
        const bodyIndex = Math.floor(Math.random() * lotteryData.celestialBodies.length);
        const bodyName = lotteryData.celestialBodies[bodyIndex];
        
        // 创建新的随机奖品对象
        const newPrize = { 
            world: worldId,
            whale: whaleName,
            celestialBody: bodyName,
            prizeType: 'first',
            isExtra: true,  // 标记为额外生成
            drawCount: this.firstPrizeDrawCount
        };
        
        // 记录并返回
        this.drawnPrizes.push(newPrize);
        this.currentPrize = newPrize;
        return newPrize;
    }
    
    // 获取剩余奖品总数
    getRemainingCount() {
        // 二等奖和三等奖返回实际剩余数量
        const secondAndThirdCount = this.thirdPrizes.length + this.secondPrizes.length;
        
        // 一等奖始终返回至少为1，表示可以继续抽取
        const firstCount = Math.max(1, this.firstPrizes.length);
        
        return secondAndThirdCount + firstCount;
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