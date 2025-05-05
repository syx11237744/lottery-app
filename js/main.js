// main.js
import LotterySystem from './lottery.js';
import AnimationController from './animation.js';

document.addEventListener('DOMContentLoaded', function() {
    // 获取HTML元素引用
    const canvas = document.getElementById('lotteryCanvas');
    const startButton = document.getElementById('startButton');
    const resultDisplay = document.getElementById('resultDisplay');
    const remainingCountDisplay = document.getElementById('remainingCount');
    
    // 初始化抽奖系统
    const lottery = new LotterySystem();
    
    // 初始化动画控制器
    const animator = new AnimationController(canvas);
    animator.start();
    
    // 更新剩余数量和阶段显示
    updateDisplays();
    
    // 给开始按钮添加事件监听器
    startButton.addEventListener('click', function() {
        // 如果图像仍在加载中，忽略点击
        if (animator.animationState === 'loading') {
            return;
        }
        
        // 检查动画是否正在进行
        if (animator.animationState !== 'idle' && animator.animationState !== 'revealing') {
            return; // 动画正在进行，忽略点击
        }
        
        // 如果我们处于揭示状态，重置并返回空闲
        if (animator.animationState === 'revealing') {
            animator.reset();
            resultDisplay.innerHTML = '';
            return;
        }
        
        // 抽取奖品
        const prize = lottery.drawPrize();
        
        if (prize) {
            // 开始抽奖动画
            animator.startDrawing(prize);
            
            // 更新显示
            updateDisplays();
        } else {
            resultDisplay.innerHTML = '<p>所有奖品已抽完！</p>';
        }
    });
    
    // 添加事件监听器处理奖品揭示期间的点击
    canvas.addEventListener('click', function() {
        // 如果我们处于揭示状态，继续下一次抽奖
        if (animator.animationState === 'revealing') {
            animator.reset();
            resultDisplay.innerHTML = '';
        }
    });
    
    // 更新显示的函数
    function updateDisplays() {
        // 更新剩余奖品数量
        remainingCountDisplay.textContent = `剩余奖品: ${lottery.getRemainingCount()}`;
    }
});

// 在main.js文件中添加以下代码来处理翻页功能
canvas.addEventListener('click', function(event) {
    // 只在显示结果状态下处理点击
    if (animator.animationState === 'revealing') {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 如果正在显示批量奖项
        if (animator.prizeToReveal.allPrizes) {
            const totalPages = Math.ceil(animator.prizeToReveal.allPrizes.length / 10);
            
            // 检查是否点击了"上一页"按钮
            if (animator.currentPage > 1 && 
                x >= animator.canvas.width * 0.35 - 40 && 
                x <= animator.canvas.width * 0.35 + 40 && 
                y >= animator.canvas.height * 0.73 - 15 && 
                y <= animator.canvas.height * 0.73 + 15) {
                
                animator.currentPage--;
                return; // 不重置，只翻页
            }
            
            // 检查是否点击了"下一页"按钮
            if (animator.currentPage < totalPages && 
                x >= animator.canvas.width * 0.65 - 80 && 
                x <= animator.canvas.width * 0.65 && 
                y >= animator.canvas.height * 0.73 - 15 && 
                y <= animator.canvas.height * 0.73 + 15) {
                
                animator.currentPage++;
                return; // 不重置，只翻页
            }
            
            // 检查是否点击了"继续抽奖"按钮
            if (x >= animator.canvas.width * 0.5 - 60 && 
                x <= animator.canvas.width * 0.5 + 60 && 
                y >= animator.canvas.height * 0.78 && 
                y <= animator.canvas.height * 0.78 + 35) {
                
                animator.reset();
                resultDisplay.innerHTML = '';
            }
        } else {
            // 一等奖/特等奖的继续按钮
            if (x >= animator.canvas.width * 0.5 - 60 && 
                x <= animator.canvas.width * 0.5 + 60 && 
                y >= animator.canvas.height * 0.65 && 
                y <= animator.canvas.height * 0.65 + 35) {
                
                animator.reset();
                resultDisplay.innerHTML = '';
            }
        }
    }
});

// 在main.js文件中修改canvas点击事件处理
canvas.addEventListener('click', function(event) {
    // 只在显示结果状态下处理点击
    if (animator.animationState === 'revealing') {
        // 点击任何地方都继续抽奖
        animator.reset();
        resultDisplay.innerHTML = '';
    }
});