// 全局变量
let currentPage = '';
let currentData = [];
let filteredData = [];

// 分页相关变量
let exceptionCurrentPage = 1;
let exceptionPageSize = 20;
let exceptionTotalPages = 1;
let exceptionTotalItems = 0;
let exceptionPageData = [];

// 订单列表分页相关变量
let orderCurrentPage = 1;
let orderPageSize = 20;
let orderTotalPages = 1;
let orderTotalItems = 0;
let orderPageData = [];
let orderFullData = [];

// 通用列表分页相关变量
let generalCurrentPage = 1;
let generalPageSize = 20;
let generalTotalPages = 1;
let generalTotalItems = 0;
let generalPageData = [];

// DOM 元素
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const toggleBtn = document.getElementById('toggleBtn');
const pageTitle = document.getElementById('pageTitle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const tableContainer = document.getElementById('tableContainer');

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupMenuToggle();
    setupMenuNavigation();
    setupSearch();
}

// 设置菜单切换功能
function setupMenuToggle() {
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });
}

// 设置菜单导航
function setupMenuNavigation() {
    // 处理有子菜单的菜单项
    const menuItemsWithSubmenu = document.querySelectorAll('.has-submenu > .menu-link');
    menuItemsWithSubmenu.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const menuItem = this.parentElement;
            const isExpanded = menuItem.classList.contains('expanded');
            
            // 关闭其他展开的菜单
            document.querySelectorAll('.menu-item.expanded').forEach(item => {
                if (item !== menuItem) {
                    item.classList.remove('expanded');
                }
            });
            
            // 切换当前菜单状态
            menuItem.classList.toggle('expanded', !isExpanded);
        });
    });

    // 处理一级菜单点击
    const mainMenuLinks = document.querySelectorAll('.menu-link[data-page]');
    mainMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.getAttribute('data-page');
            navigateToPage(pageName);
            setActiveMenu(this);
        });
    });

    // 处理子菜单点击
    const submenuLinks = document.querySelectorAll('.submenu-link[data-page]');
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.getAttribute('data-page');
            navigateToPage(pageName);
            setActiveMenu(this);
        });
    });
}

// 设置活跃菜单样式
function setActiveMenu(activeElement) {
    // 清除所有活跃状态
    document.querySelectorAll('.menu-link.active, .submenu-link.active').forEach(link => {
        link.classList.remove('active');
    });
    
    // 设置当前活跃菜单
    activeElement.classList.add('active');
}

// 页面导航
function navigateToPage(pageName) {
    currentPage = pageName;
    pageTitle.textContent = pageName;
    
    // 特殊页面处理
    if (pageName === '履约异常列表') {
        renderExceptionListPage();
    } else if (pageName === '订单列表') {
        renderOrderListPage();
    } else {
        // 隐藏搜索容器，显示默认的表格容器
        document.querySelector('.search-container').style.display = 'flex';
        // 尝试加载对应的CSV数据
        loadPageData(pageName);
    }
}

// 加载页面数据
async function loadPageData(pageName) {
    try {
        // 构建CSV文件路径
        const csvFileName = `${pageName}.csv`;
        const csvPath = `./data/${csvFileName}`;
        
        showLoading();
        
        // 尝试获取CSV文件
        const response = await fetch(csvPath);
        
        if (response.ok) {
            const csvText = await response.text();
            const data = parseCSV(csvText);
            currentData = data;
            filteredData = [...data];
            
            // 重置分页状态
            generalCurrentPage = 1;
            
            renderTable(filteredData);
        } else {
            // 文件不存在，显示空状态
            showEmptyState(`${pageName} 的数据文件尚未上传`);
        }
    } catch (error) {
        console.log('加载数据时出错:', error);
        showEmptyState(`${pageName} 的数据文件尚未上传`);
    }
}

// 解析CSV文件
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    // 更智能的CSV解析，处理引号和逗号
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            
            // 处理科学计数法数字，如果是纯数字则转换为正常格式
            if (value.includes('E+') && !isNaN(parseFloat(value))) {
                const num = parseFloat(value);
                if (num.toString().length < 15) { // 避免过长的数字
                    value = num.toString();
                }
            }
            
            // 清理空白符和特殊字符
            value = value.replace(/^["']|["']$/g, ''); // 移除首尾引号
            if (value === '-') value = ''; // 将 '-' 转换为空字符串
            
            row[header] = value;
        });
        data.push(row);
    }
    
    return data;
}

// 渲染表格
function renderTable(data) {
    if (!data || data.length === 0) {
        showEmptyState('暂无数据');
        return;
    }

    // 设置分页信息
    generalTotalItems = data.length;
    generalTotalPages = Math.ceil(generalTotalItems / generalPageSize);
    if (generalCurrentPage > generalTotalPages) {
        generalCurrentPage = 1;
    }

    // 获取当前页数据
    const startIndex = (generalCurrentPage - 1) * generalPageSize;
    const endIndex = startIndex + generalPageSize;
    generalPageData = data.slice(startIndex, endIndex);

    const headers = Object.keys(data[0]);
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
                <tr class="filter-row">
                    ${headers.map(header => `
                        <td>
                            <input type="text" placeholder="筛选 ${header}" 
                                   onchange="filterTable()" 
                                   data-column="${header}">
                        </td>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${generalPageData.map(row => `
                    <tr>
                        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- 分页组件 -->
        <div class="pagination-container">
            <div class="pagination-info">
                <span>共 <span id="generalTotalItems">${generalTotalItems}</span> 条</span>
            </div>
            <div class="pagination-controls">
                <div class="pagination-pages" id="generalPaginationPages">
                    ${renderGeneralPaginationButtons()}
                </div>
                <div class="page-size-selector">
                    <select id="generalPageSizeSelect" onchange="changeGeneralPageSize()">
                        <option value="10" ${generalPageSize === 10 ? 'selected' : ''}>10条/页</option>
                        <option value="20" ${generalPageSize === 20 ? 'selected' : ''}>20条/页</option>
                        <option value="50" ${generalPageSize === 50 ? 'selected' : ''}>50条/页</option>
                        <option value="100" ${generalPageSize === 100 ? 'selected' : ''}>100条/页</option>
                    </select>
                </div>
                <div class="page-jump">
                    <span>跳至</span>
                    <input type="number" id="generalJumpPageInput" min="1" max="${generalTotalPages}" value="${generalCurrentPage}">
                    <span>页</span>
                    <button onclick="jumpToGeneralPage()">跳转</button>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// 显示加载状态
function showLoading() {
    tableContainer.innerHTML = `
        <div class="empty-state">
            <div class="loading"></div>
            <p>正在加载数据...</p>
        </div>
    `;
}

// 显示空状态
function showEmptyState(message = '暂无数据') {
    tableContainer.innerHTML = `
        <div class="empty-state">
            <p>${message}</p>
            <p>请将对应的CSV文件放置在data文件夹中</p>
        </div>
    `;
}

// 渲染通用分页按钮
function renderGeneralPaginationButtons() {
    let pagesHTML = '';
    
    // 计算显示的页码范围
    const maxVisiblePages = 7;
    let startPage = Math.max(1, generalCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(generalTotalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 上一页按钮
    if (generalCurrentPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToGeneralPage(${generalCurrentPage - 1})">上一页</button>`;
    }
    
    // 第一页
    if (startPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToGeneralPage(1)">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === generalCurrentPage ? ' active' : '';
        pagesHTML += `<button class="page-btn${activeClass}" onclick="goToGeneralPage(${i})">${i}</button>`;
    }
    
    // 最后一页
    if (endPage < generalTotalPages) {
        if (endPage < generalTotalPages - 1) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
        pagesHTML += `<button class="page-btn" onclick="goToGeneralPage(${generalTotalPages})">${generalTotalPages}</button>`;
    }
    
    // 下一页按钮
    if (generalCurrentPage < generalTotalPages) {
        pagesHTML += `<button class="page-btn" onclick="goToGeneralPage(${generalCurrentPage + 1})">下一页</button>`;
    }
    
    return pagesHTML;
}

// 跳转到指定页面（通用）
function goToGeneralPage(page) {
    if (page < 1 || page > generalTotalPages) return;
    
    generalCurrentPage = page;
    renderTable(filteredData);
}

// 改变每页显示数量（通用）
function changeGeneralPageSize() {
    const pageSizeSelect = document.getElementById('generalPageSizeSelect');
    if (pageSizeSelect) {
        generalPageSize = parseInt(pageSizeSelect.value);
        generalCurrentPage = 1; // 重置到第一页
        renderTable(filteredData);
    }
}

// 跳转到指定页面（通用）
function jumpToGeneralPage() {
    const jumpPageInput = document.getElementById('generalJumpPageInput');
    if (jumpPageInput) {
        const page = parseInt(jumpPageInput.value);
        if (page >= 1 && page <= generalTotalPages) {
            goToGeneralPage(page);
        }
    }
}

// 设置搜索功能
function setupSearch() {
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', performSearch);
    
    // 搜索输入框回车事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 实时搜索（可选）
    searchInput.addEventListener('input', debounce(performSearch, 300));
}

// 执行搜索
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!currentData || currentData.length === 0) {
        return;
    }
    
    if (!searchTerm) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(row => {
            return Object.values(row).some(value => 
                value.toString().toLowerCase().includes(searchTerm)
            );
        });
    }
    
    // 重置到第一页
    generalCurrentPage = 1;
    
    renderTable(filteredData);
}

// 表格筛选功能
function filterTable() {
    const filterInputs = document.querySelectorAll('.filter-row input');
    const filters = {};
    
    filterInputs.forEach(input => {
        const column = input.getAttribute('data-column');
        const value = input.value.trim().toLowerCase();
        if (value) {
            filters[column] = value;
        }
    });
    
    if (Object.keys(filters).length === 0) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(row => {
            return Object.keys(filters).every(column => {
                const cellValue = (row[column] || '').toString().toLowerCase();
                return cellValue.includes(filters[column]);
            });
        });
    }
    
    // 重置到第一页
    generalCurrentPage = 1;
    
    renderTable(filteredData);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 导出功能（可选）
function exportToCSV() {
    if (!filteredData || filteredData.length === 0) {
        alert('没有数据可以导出');
        return;
    }
    
    const headers = Object.keys(filteredData[0]);
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentPage}_导出数据.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 窗口大小改变时的响应
window.addEventListener('resize', function() {
    // 可以在这里添加响应式处理逻辑
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
});

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl+F 聚焦搜索框
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape 清除搜索
    if (e.key === 'Escape') {
        searchInput.value = '';
        performSearch();
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('JavaScript错误:', e.error);
});

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 默认加载第一个菜单项
    const firstMenuItem = document.querySelector('.menu-link[data-page]');
    if (firstMenuItem) {
        firstMenuItem.click();
    }
});

// 履约异常列表页面渲染
function renderExceptionListPage() {
    // 隐藏默认搜索容器
    document.querySelector('.search-container').style.display = 'none';
    
    const exceptionPageHTML = `
        <!-- 条件查询搜索框 -->
        <div class="exception-search-form">
            <div class="form-section-header">
                <span class="form-section-title">查询条件</span>
                <button class="expand-toggle" id="expandToggle">展开</button>
            </div>
            <div class="form-content" id="formContent">
                <div class="form-grid">
                    <div class="form-item">
                        <label>订单国家</label>
                        <select id="orderCountry">
                            <option value="">请选择</option>
                            <option value="中国">中国</option>
                            <option value="泰国">泰国</option>
                            <option value="马来西亚">马来西亚</option>
                            <option value="印度尼西亚">印度尼西亚</option>
                            <option value="香港">香港</option>
                            <option value="巴西">巴西</option>
                            <option value="匈牙利">匈牙利</option>
                            <option value="越南">越南</option>
                            <option value="乌兹别克斯坦">乌兹别克斯坦</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>订单类型</label>
                        <select id="orderType">
                            <option value="">请选择</option>
                            <option value="跨境直发">跨境直发</option>
                            <option value="本本直发">本本直发</option>
                            <option value="备货仓发">备货仓发</option>
                            <option value="备货入库">备货入库</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>WIMP订单状态</label>
                        <select id="wimpStatus">
                            <option value="">请选择</option>
                            <option value="提单">提单</option>
                            <option value="已取消">已取消</option>
                            <option value="客户审批完成">客户审批完成</option>
                            <option value="运营已确认">运营已确认</option>
                            <option value="已提交ept订单">已提交ept订单</option>
                            <option value="已取消内贸段订单">已取消内贸段订单</option>
                            <option value="已确认跨境采购单">已确认跨境采购单</option>
                            <option value="已发货">已发货</option>
                            <option value="已收货">已收货</option>
                            <option value="已完成">已完成</option>
                            <option value="商品数据问题，订单下传失败">商品数据问题，订单下传失败</option>
                            <option value="已取消跨境采购单">已取消跨境采购单</option>
                            <option value="已提交跨境采购单">已提交跨境采购单</option>
                            <option value="已取消本土采购单">已取消本土采购单</option>
                            <option value="已提交本土采购单">已提交本土采购单</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>订单号/采购单号</label>
                        <textarea id="orderNumbers" placeholder="请输入订单号/采购单号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="form-item">
                        <label>下单日期</label>
                        <div class="date-range-input">
                            <input type="date" id="orderDateStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="orderDateEnd" placeholder="请选择">
                        </div>
                    </div>
                    <div class="form-item">
                        <label>客户简码</label>
                        <select id="customerName" style="width: 100%;">
                            <option value="">请选择或输入</option>
                            <!-- 客户选项将通过loadCustomerOptions()函数动态加载 -->
                        </select>
                    </div>
                    <div class="form-item">
                        <label>订单来源</label>
                        <select id="orderSource">
                            <option value="">请选择</option>
                            <option value="SRM-LINK">SRM-LINK</option>
                            <option value="WIOP">WIOP</option>
                            <option value="WISP">WISP</option>
                            <option value="WIEP">WIEP</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>客户PO号</label>
                        <input type="text" id="customerPO" placeholder="请输入">
                    </div>
                    <div class="form-item">
                        <label>备货仓名称</label>
                        <select id="stockWarehouse" style="width: 100%;">
                            <option value="">请选择或输入</option>
                            <option value="泰国中心仓1号（林查班）">泰国中心仓1号（林查班）</option>
                            <option value="越南中心仓1号（北宁）">越南中心仓1号（北宁）</option>
                            <option value="越南中心仓3号（同奈）">越南中心仓3号（同奈）</option>
                            <option value="印尼中心仓1号（雅加达）">印尼中心仓1号（雅加达）</option>
                            <option value="匈牙利中心仓1号（布达佩斯）">匈牙利中心仓1号（布达佩斯）</option>
                            <option value="巴西中心仓2号（萨尔瓦多）">巴西中心仓2号（萨尔瓦多）</option>
                            <option value="马来西亚中心仓1号（吉隆坡）">马来西亚中心仓1号（吉隆坡）</option>
                            <option value="马来西亚中心仓2号（槟城）">马来西亚中心仓2号（槟城）</option>
                            <option value="巴西中心仓1号（圣保罗）">巴西中心仓1号（圣保罗）</option>
                            <option value="京东物流沙特仓">京东物流沙特仓</option>
                            <option value="京东物流匈牙利集货仓">京东物流匈牙利集货仓</option>
                            <option value="京东国际物流越南仓">京东国际物流越南仓</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>企配仓名称</label>
                        <select id="enterpriseWarehouse" style="width: 100%;">
                            <option value="">请选择或输入</option>
                            <option value="北京企配仓1号">北京企配仓1号</option>
                            <option value="上海企配仓2号">上海企配仓2号</option>
                            <option value="广州企配仓3号">广州企配仓3号</option>
                            <option value="深圳企配仓4号">深圳企配仓4号</option>
                            <option value="杭州企配仓5号">杭州企配仓5号</option>
                            <option value="成都企配仓6号">成都企配仓6号</option>
                            <option value="武汉企配仓7号">武汉企配仓7号</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label>企配收货时间</label>
                        <div class="date-range-input">
                            <input type="date" id="enterpriseReceiveStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="enterpriseReceiveEnd" placeholder="请选择">
                        </div>
                    </div>
                    <div class="form-item">
                        <label>内贸段订单号</label>
                        <textarea id="domesticOrderNumbers" placeholder="请输入内贸段订单号，支持多个单号换行输入"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-reset" onclick="resetSearchForm()">重置</button>
                    <button class="btn-search" onclick="searchExceptions()">查询</button>
                </div>
            </div>
        </div>

        <!-- 异常列表 -->
        <div class="exception-list-header">
            <span class="exception-list-title">履约异常列表</span>
            <button class="btn-export" onclick="exportExceptions()">导出</button>
        </div>
        <div class="exception-table-container">
            <table class="exception-table">
                <thead>
                    <tr>
                        <th class="fixed-column first">订单号</th>
                        <th class="scrollable-column">订单类型</th>
                        <th class="scrollable-column">订单国家</th>
                        <th class="scrollable-column">客户简码</th>
                        <th class="scrollable-column">下单时间</th>
                        <th class="scrollable-column">承诺发货时间</th>
                        <th class="scrollable-column">承诺送达时间</th>
                        <th class="scrollable-column">异常环节</th>
                        <th class="scrollable-column">异常类型</th>
                        <th class="scrollable-column">异常状态</th>
                        <th class="scrollable-column">异常开始时间</th>
                        <th class="scrollable-column">异常关闭时间</th>
                        <th class="scrollable-column">WOMS工单号</th>
                        <th class="fixed-column last">操作</th>
                    </tr>
                </thead>
                <tbody id="exceptionTableBody">
                    <!-- 示例数据 -->
                    <tr>
                        <td class="fixed-column first">ORD20240701001</td>
                        <td>跨境直发</td>
                        <td>泰国</td>
                        <td>hRvDgUX263Y2FuWbVzB8</td>
                        <td>2024-07-01 10:30</td>
                        <td>2024-07-05 18:00</td>
                        <td>2024-07-10 18:00</td>
                        <td>运输环节</td>
                        <td>物流延误</td>
                        <td>处理中</td>
                        <td>2024-07-06 08:00</td>
                        <td>-</td>
                        <td>WOMS2024070101</td>
                        <td class="fixed-column last">
                            <a href="#" class="action-link" onclick="viewExceptionDetail('ORD20240701001')">详情</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="fixed-column first">ORD20240701002</td>
                        <td>本本直发</td>
                        <td>越南</td>
                        <td>yPpvH0qjoPodSR8M4LCb</td>
                        <td>2024-07-01 14:20</td>
                        <td>2024-07-03 18:00</td>
                        <td>2024-07-08 18:00</td>
                        <td>清关环节</td>
                        <td>清关异常</td>
                        <td>已关闭</td>
                        <td>2024-07-04 09:30</td>
                        <td>2024-07-05 16:45</td>
                        <td>WOMS2024070102</td>
                        <td class="fixed-column last">
                            <a href="#" class="action-link" onclick="viewExceptionDetail('ORD20240701002')">详情</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="fixed-column first">ORD20240701003</td>
                        <td>备货仓发</td>
                        <td>马来西亚</td>
                        <td>tPpvH0qjoPodSR8M4LCt</td>
                        <td>2024-07-01 16:45</td>
                        <td>2024-07-04 18:00</td>
                        <td>2024-07-09 18:00</td>
                        <td>仓储环节</td>
                        <td>库存不足</td>
                        <td>处理中</td>
                        <td>2024-07-02 11:00</td>
                        <td>-</td>
                        <td>WOMS2024070103</td>
                        <td class="fixed-column last">
                            <a href="#" class="action-link" onclick="viewExceptionDetail('ORD20240701003')">详情</a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-container">
            <div class="pagination-info">
                <span>共 <span id="totalItems">3</span> 条</span>
            </div>
            <div class="pagination-controls">
                <div class="pagination-pages" id="paginationPages">
                    <button class="page-btn" onclick="goToPage(1)">1</button>
                    <button class="page-btn active" onclick="goToPage(2)">2</button>
                    <span class="page-ellipsis">…</span>
                    <button class="page-btn" onclick="goToPage(10)">10</button>
                </div>
                <div class="page-size-selector">
                    <select id="pageSizeSelect" onchange="changePageSize()">
                        <option value="10">10条/页</option>
                        <option value="20" selected>20条/页</option>
                        <option value="50">50条/页</option>
                        <option value="100">100条/页</option>
                    </select>
                </div>
                <div class="page-jump">
                    <span>跳至</span>
                    <input type="number" id="jumpPageInput" min="1" max="1" value="1">
                    <span>页</span>
                    <button onclick="jumpToPage()">跳转</button>
                </div>
            </div>
        </div>

        <!-- 导出确认模态框 -->
        <div class="modal-overlay" id="exportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">导出提示</span>
                    <button class="modal-close" onclick="closeModal('exportModal')">&times;</button>
                </div>
                <div class="modal-body">
                    已导出全部异常订单信息，请到任务中心查看
                </div>
                <div class="modal-footer">
                    <button class="btn-modal primary" onclick="closeModal('exportModal')">确认</button>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.innerHTML = exceptionPageHTML;
    
    // 初始化页面交互
    initializeExceptionPage();
}

// 订单列表页面渲染
function renderOrderListPage() {
    // 隐藏默认搜索容器
    document.querySelector('.search-container').style.display = 'none';
    
    // 首先渲染页面结构
    renderOrderPageStructure();
    
    // 然后加载订单数据
    loadOrderData();
}

// 渲染订单页面结构
function renderOrderPageStructure() {
    
    const orderPageHTML = `
        <!-- 条件查询搜索框 -->
        <div class="order-search-container">
            <div class="order-search-header">
                <span class="order-search-title">查询条件</span>
                <button class="order-expand-toggle" id="orderExpandToggle">收起</button>
            </div>
            <div class="order-form-content expanded" id="orderFormContent">
                <div class="order-search-form">
                    <!-- 第一行 -->
                    <div class="order-form-group">
                        <label>订单编号</label>
                        <textarea id="orderNumbers" placeholder="请输入订单编号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>父单号</label>
                        <textarea id="parentOrderNumbers" placeholder="请输入父单号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>第三方订单号</label>
                        <textarea id="thirdPartyOrderNumbers" placeholder="请输入第三方订单编号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>订单类型</label>
                        <select id="orderType">
                            <option value="">请选择</option>
                            <option value="跨境直发">跨境直发</option>
                            <option value="本地直发">本地直发</option>
                            <option value="备货仓发">备货仓发</option>
                        </select>
                    </div>
                    
                    <!-- 第二行 -->
                    <div class="order-form-group">
                        <label>订单状态</label>
                        <select id="orderStatus">
                            <option value="">请选择</option>
                            <option value="待审批">待审批</option>
                            <option value="待确认">待确认</option>
                            <option value="待发货">待发货</option>
                            <option value="待集运收">待集运收</option>
                            <option value="待集运发">待集运发</option>
                            <option value="待企配收">待企配收</option>
                            <option value="待企配发">待企配发</option>
                            <option value="待妥投">待妥投</option>
                            <option value="待完成">待完成</option>
                            <option value="已完成">已完成</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>是否报关</label>
                        <select id="isCustoms">
                            <option value="">请选择</option>
                            <option value="是">是</option>
                            <option value="否">否</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>合同号</label>
                        <input type="text" id="contractNumber" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>客户名称</label>
                        <select id="customerName" style="width: 100%;" class="searchable-select">
                            <option value="">请选择或输入</option>
                            <!-- 客户选项将通过loadCustomerOptions()函数动态加载 -->
                        </select>
                    </div>
                    
                    <!-- 第三行 -->
                    <div class="order-form-group">
                        <label>客户企业类型</label>
                        <select id="customerType">
                            <option value="">请选择</option>
                            <option value="EPE">EPE</option>
                            <option value="FDI">FDI</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>内贸段订单号</label>
                        <textarea id="domesticOrderNumbers" placeholder="请输入内贸段订单编号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>采购单号</label>
                        <textarea id="purchaseOrderNumbers" placeholder="请输入采购单号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>下单账号</label>
                        <select id="orderAccount" class="searchable-select">
                            <option value="">请选择或输入</option>
                            <option value="admin001">admin001</option>
                            <option value="order_user_001">order_user_001</option>
                            <option value="customer_service_01">customer_service_01</option>
                            <option value="sales_manager_02">sales_manager_02</option>
                            <option value="procurement_user">procurement_user</option>
                            <option value="logistics_coordinator">logistics_coordinator</option>
                        </select>
                    </div>
                    
                    <!-- 第四行 -->
                    <div class="order-form-group">
                        <label>客户PO号</label>
                        <input type="text" id="customerPO" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>下单日期</label>
                        <div class="date-range-input">
                            <input type="date" id="orderDateStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="orderDateEnd" placeholder="请选择">
                        </div>
                    </div>
                    <div class="order-form-group">
                        <label>企配仓名称</label>
                        <select id="enterpriseWarehouse" style="width: 100%;">
                            <option value="">请选择</option>
                            <option value="北京企配仓1号">北京企配仓1号</option>
                            <option value="上海企配仓2号">上海企配仓2号</option>
                            <option value="广州企配仓3号">广州企配仓3号</option>
                            <option value="深圳企配仓4号">深圳企配仓4号</option>
                            <option value="杭州企配仓5号">杭州企配仓5号</option>
                            <option value="成都企配仓6号">成都企配仓6号</option>
                            <option value="武汉企配仓7号">武汉企配仓7号</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>备货仓名称</label>
                        <select id="stockWarehouse" style="width: 100%;">
                            <option value="">请选择</option>
                            <option value="泰国中心仓1号（林查班）">泰国中心仓1号（林查班）</option>
                            <option value="越南中心仓1号（北宁）">越南中心仓1号（北宁）</option>
                            <option value="越南中心仓3号（同奈）">越南中心仓3号（同奈）</option>
                            <option value="印尼中心仓1号（雅加达）">印尼中心仓1号（雅加达）</option>
                            <option value="匈牙利中心仓1号（布达佩斯）">匈牙利中心仓1号（布达佩斯）</option>
                            <option value="巴西中心仓2号（萨尔瓦多）">巴西中心仓2号（萨尔瓦多）</option>
                            <option value="马来西亚中心仓1号（吉隆坡）">马来西亚中心仓1号（吉隆坡）</option>
                            <option value="马来西亚中心仓2号（槟城）">马来西亚中心仓2号（槟城）</option>
                            <option value="巴西中心仓1号（圣保罗）">巴西中心仓1号（圣保罗）</option>
                            <option value="京东物流沙特仓">京东物流沙特仓</option>
                            <option value="京东物流匈牙利集货仓">京东物流匈牙利集货仓</option>
                            <option value="京东国际物流越南仓">京东国际物流越南仓</option>
                        </select>
                    </div>
                    
                    <!-- 第五行 -->
                    <div class="order-form-group">
                        <label>下发备货仓状态</label>
                        <select id="stockWarehouseStatus">
                            <option value="">请选择</option>
                            <option value="已下发">已下发</option>
                            <option value="未下发">未下发</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>企配收货时间</label>
                        <div class="date-range-input">
                            <input type="date" id="enterpriseReceiveStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="enterpriseReceiveEnd" placeholder="请选择">
                        </div>
                    </div>
                    <div class="order-form-group">
                        <label>出库单号</label>
                        <input type="text" id="outboundNumber" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>一段入仓时间</label>
                        <div class="date-range-input">
                            <input type="date" id="firstSegmentInStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="firstSegmentInEnd" placeholder="请选择">
                        </div>
                    </div>
                    
                    <!-- 第六行 -->
                    <div class="order-form-group">
                        <label>是否生成二段</label>
                        <select id="hasSecondSegment">
                            <option value="">请选择</option>
                            <option value="是">是</option>
                            <option value="否">否</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>签单状态</label>
                        <select id="signStatus">
                            <option value="">请选择</option>
                            <option value="待审批">待审批</option>
                            <option value="已通过">已通过</option>
                            <option value="未通过">未通过</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>hold单状态</label>
                        <select id="holdStatus">
                            <option value="">请选择</option>
                            <option value="是">是</option>
                            <option value="否">否</option>
                        </select>
                    </div>
                    <div class="order-form-group"></div> <!-- 占位符保持对齐 -->
                </div>
                <div class="order-actions">
                    <button class="btn-reset" onclick="resetOrderSearchForm()">重置</button>
                    <button class="btn-search" onclick="searchOrders()">查询</button>
                </div>
            </div>
        </div>

        <!-- 订单列表 -->
        <div class="order-table-container">
            <div class="order-table-header">
                <div class="order-table-title">订单列表</div>
                <div class="order-table-tools">
                    <div class="left-tools">
                        <button class="btn-batch" onclick="batchDelivery()">合单派送</button>
                        <button class="btn-export" onclick="exportOrders()">导出</button>
                    </div>
                    <div class="right-tools">
                        <button class="btn-columns" onclick="showColumnSelector()">隐藏字段</button>
                    </div>
                </div>
            </div>
            <div class="order-table-wrapper">
                <table class="order-table">
                    <thead>
                        <tr>
                            <th class="fixed-column checkbox-column">
                                <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)">
                            </th>
                            <th class="fixed-column first">订单编号</th>
                        <th class="scrollable-column">父单编号</th>
                        <th class="scrollable-column">订单来源</th>
                        <th class="scrollable-column">三方单号</th>
                        <th class="scrollable-column">客户PO号</th>
                        <th class="scrollable-column">内贸订单号</th>
                        <th class="scrollable-column">采购单号</th>
                        <th class="scrollable-column">业务模式</th>
                        <th class="scrollable-column">订单状态</th>
                        <th class="scrollable-column">下单账号</th>
                        <th class="scrollable-column">合同号</th>
                        <th class="scrollable-column">客户名称</th>
                        <th class="scrollable-column">币种</th>
                        <th class="scrollable-column">订单金额</th>
                        <th class="scrollable-column">下单时间</th>
                        <th class="scrollable-column">客户审批时间</th>
                        <th class="scrollable-column">付款时间</th>
                        <th class="scrollable-column">订单确认时间</th>
                        <th class="scrollable-column">备货仓名称</th>
                        <th class="scrollable-column">一段运单号</th>
                        <th class="scrollable-column">计划发货时间</th>
                        <th class="scrollable-column">发货时间</th>
                        <th class="scrollable-column">集运中心入仓时间</th>
                        <th class="scrollable-column">集运中心发货时间</th>
                        <th class="scrollable-column">企配名称</th>
                        <th class="scrollable-column">二段运单号</th>
                        <th class="scrollable-column">企配收货时间</th>
                        <th class="scrollable-column">企配发货时间</th>
                        <th class="scrollable-column">实物妥投时间</th>
                        <th class="scrollable-column">承诺送达时间</th>
                        <th class="scrollable-column">计划妥投时间</th>
                        <th class="scrollable-column">签单状态</th>
                        <th class="scrollable-column">系统妥投时间</th>
                        <th class="scrollable-column">完成时间</th>
                        <th class="scrollable-column">hold单状态</th>
                        <th class="fixed-action">操作</th>
                    </tr>
                </thead>
                <tbody id="orderTableBody">
                    <!-- 示例数据 -->
                    <tr>
                        <td class="fixed-column first">ORD20240701001</td>
                        <td>PARENT001</td>
                        <td>WIOP</td>
                        <td>3RD001</td>
                        <td>PO2024001</td>
                        <td>DOM001</td>
                        <td>PUR001</td>
                        <td>跨境直发</td>
                        <td>待发货</td>
                        <td>admin001</td>
                        <td>CT2024001</td>
                        <td>华为技术有限公司</td>
                        <td>USD</td>
                        <td>15000.00</td>
                        <td>2024-07-01 10:30</td>
                        <td>2024-07-01 14:20</td>
                        <td>2024-07-02 09:15</td>
                        <td>2024-07-02 16:30</td>
                        <td>泰国中心仓1号（林查班）</td>
                        <td>WB001</td>
                        <td>2024-07-03 18:00</td>
                        <td>2024-07-03 20:30</td>
                        <td>2024-07-04 08:00</td>
                        <td>2024-07-04 16:00</td>
                        <td>北京企配仓1号</td>
                        <td>WB002</td>
                        <td>2024-07-05 10:00</td>
                        <td>2024-07-05 18:00</td>
                        <td>2024-07-06 14:30</td>
                        <td>2024-07-10 18:00</td>
                        <td>2024-07-08 18:00</td>
                        <td>已通过</td>
                        <td>2024-07-06 15:00</td>
                        <td>2024-07-07 09:00</td>
                        <td>否</td>
                        <td class="fixed-action">
                            <a href="#" class="action-link" onclick="viewOrderDetail('ORD20240701001')">查看详情</a>
                            <a href="#" class="action-link" onclick="printOrder('ORD20240701001')">打印</a>
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-container">
            <div class="pagination-info">
                <span>共 <span id="orderTotalItems">1</span> 条</span>
            </div>
            <div class="pagination-controls">
                <div class="pagination-pages" id="orderPaginationPages">
                    <button class="page-btn active" onclick="goToOrderPage(1)">1</button>
                </div>
                <div class="page-size-selector">
                    <select id="orderPageSizeSelect" onchange="changeOrderPageSize()">
                        <option value="10">10条/页</option>
                        <option value="20" selected>20条/页</option>
                        <option value="50">50条/页</option>
                        <option value="100">100条/页</option>
                    </select>
                </div>
                <div class="page-jump">
                    <span>跳至</span>
                    <input type="number" id="orderJumpPageInput" min="1" max="1" value="1">
                    <span>页</span>
                    <button onclick="jumpToOrderPage()">跳转</button>
                </div>
            </div>
        </div>

        <!-- 导出字段选择模态框 -->
        <div class="modal-overlay" id="exportFieldsModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <span class="modal-title">选择导出字段</span>
                    <button class="modal-close" onclick="closeModal('exportFieldsModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="export-fields-container">
                        <div class="field-group">
                            <label><input type="checkbox" value="orderNumber" checked> 订单编号</label>
                            <label><input type="checkbox" value="parentOrderNumber" checked> 父单编号</label>
                            <label><input type="checkbox" value="orderSource" checked> 订单来源</label>
                            <label><input type="checkbox" value="thirdPartyNumber" checked> 三方单号</label>
                            <label><input type="checkbox" value="customerPO" checked> 客户PO号</label>
                            <label><input type="checkbox" value="domesticOrderNumber" checked> 内贸订单号</label>
                            <label><input type="checkbox" value="purchaseOrderNumber" checked> 采购单号</label>
                            <label><input type="checkbox" value="businessMode" checked> 业务模式</label>
                            <label><input type="checkbox" value="orderStatus" checked> 订单状态</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="orderAccount" checked> 下单账号</label>
                            <label><input type="checkbox" value="contractNumber" checked> 合同号</label>
                            <label><input type="checkbox" value="customerName" checked> 客户名称</label>
                            <label><input type="checkbox" value="currency" checked> 币种</label>
                            <label><input type="checkbox" value="orderAmount" checked> 订单金额</label>
                            <label><input type="checkbox" value="orderTime" checked> 下单时间</label>
                            <label><input type="checkbox" value="customerApprovalTime" checked> 客户审核完成时间</label>
                            <label><input type="checkbox" value="paymentTime" checked> 付款时间</label>
                            <label><input type="checkbox" value="orderConfirmTime" checked> 订单确认时间</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="stockWarehouseName" checked> 备货仓名称</label>
                            <label><input type="checkbox" value="firstSegmentNumber" checked> 一段运单号</label>
                            <label><input type="checkbox" value="plannedShipTime" checked> 计划发货时间</label>
                            <label><input type="checkbox" value="shipTime" checked> 发货时间</label>
                            <label><input type="checkbox" value="consolidationInTime" checked> 集运中心入仓时间</label>
                            <label><input type="checkbox" value="consolidationOutTime" checked> 集运中心发货时间</label>
                            <label><input type="checkbox" value="enterpriseName" checked> 企配名称</label>
                            <label><input type="checkbox" value="secondSegmentNumber" checked> 二段运单号</label>
                            <label><input type="checkbox" value="enterpriseReceiveTime" checked> 企配收货时间</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="enterpriseShipTime" checked> 企配发货时间</label>
                            <label><input type="checkbox" value="actualDeliveryTime" checked> 实物妥投时间</label>
                            <label><input type="checkbox" value="promisedDeliveryTime" checked> 承诺送达时间</label>
                            <label><input type="checkbox" value="plannedDeliveryTime" checked> 计划妥投时间</label>
                            <label><input type="checkbox" value="signStatus" checked> 签单状态</label>
                            <label><input type="checkbox" value="systemDeliveryTime" checked> 系统妥投时间</label>
                            <label><input type="checkbox" value="completeTime" checked> 完成时间</label>
                            <label><input type="checkbox" value="holdStatus" checked> hold单状态</label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal secondary" onclick="selectAllFields()">全选</button>
                    <button class="btn-modal secondary" onclick="clearAllFields()">清空</button>
                    <button class="btn-modal secondary" onclick="closeModal('exportFieldsModal')">取消</button>
                    <button class="btn-modal primary" onclick="confirmExportFields()">确认导出</button>
                </div>
            </div>
        </div>

        <!-- 隐藏字段选择模态框 -->
        <div class="modal-overlay" id="columnSelectorModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <span class="modal-title">选择显示字段</span>
                    <button class="modal-close" onclick="closeModal('columnSelectorModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="column-selector-container">
                        <div class="field-group">
                            <label><input type="checkbox" value="orderNumber" checked disabled> 订单编号</label>
                            <label><input type="checkbox" value="parentOrderNumber" checked> 父单编号</label>
                            <label><input type="checkbox" value="orderSource" checked> 订单来源</label>
                            <label><input type="checkbox" value="thirdPartyNumber" checked> 三方单号</label>
                            <label><input type="checkbox" value="customerPO" checked> 客户PO号</label>
                            <label><input type="checkbox" value="domesticOrderNumber" checked> 内贸订单号</label>
                            <label><input type="checkbox" value="purchaseOrderNumber" checked> 采购单号</label>
                            <label><input type="checkbox" value="businessMode" checked> 业务模式</label>
                            <label><input type="checkbox" value="orderStatus" checked> 订单状态</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="orderAccount" checked> 下单账号</label>
                            <label><input type="checkbox" value="contractNumber" checked> 合同号</label>
                            <label><input type="checkbox" value="customerName" checked> 客户名称</label>
                            <label><input type="checkbox" value="currency" checked> 币种</label>
                            <label><input type="checkbox" value="orderAmount" checked> 订单金额</label>
                            <label><input type="checkbox" value="orderTime" checked> 下单时间</label>
                            <label><input type="checkbox" value="customerApprovalTime" checked> 客户审批时间</label>
                            <label><input type="checkbox" value="paymentTime" checked> 付款时间</label>
                            <label><input type="checkbox" value="orderConfirmTime" checked> 订单确认时间</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="stockWarehouseName" checked> 备货仓名称</label>
                            <label><input type="checkbox" value="firstSegmentNumber" checked> 一段运单号</label>
                            <label><input type="checkbox" value="plannedShipTime" checked> 计划发货时间</label>
                            <label><input type="checkbox" value="shipTime" checked> 发货时间</label>
                            <label><input type="checkbox" value="consolidationInTime" checked> 集运中心入仓时间</label>
                            <label><input type="checkbox" value="consolidationOutTime" checked> 集运中心发货时间</label>
                            <label><input type="checkbox" value="enterpriseName" checked> 企配名称</label>
                            <label><input type="checkbox" value="secondSegmentNumber" checked> 二段运单号</label>
                            <label><input type="checkbox" value="enterpriseReceiveTime" checked> 企配收货时间</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="enterpriseShipTime" checked> 企配发货时间</label>
                            <label><input type="checkbox" value="actualDeliveryTime" checked> 实物妥投时间</label>
                            <label><input type="checkbox" value="promisedDeliveryTime" checked> 承诺送达时间</label>
                            <label><input type="checkbox" value="plannedDeliveryTime" checked> 计划妥投时间</label>
                            <label><input type="checkbox" value="signStatus" checked> 签单状态</label>
                            <label><input type="checkbox" value="systemDeliveryTime" checked> 系统妥投时间</label>
                            <label><input type="checkbox" value="completeTime" checked> 完成时间</label>
                            <label><input type="checkbox" value="holdStatus" checked> hold单状态</label>
                            <label><input type="checkbox" value="actions" checked disabled> 操作</label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal secondary" onclick="selectAllColumns()">全选</button>
                    <button class="btn-modal secondary" onclick="clearAllColumns()">清空</button>
                    <button class="btn-modal secondary" onclick="closeModal('columnSelectorModal')">取消</button>
                    <button class="btn-modal primary" onclick="confirmColumnSelection()">确认</button>
                </div>
            </div>
        </div>

        <!-- 导出确认模态框 -->
        <div class="modal-overlay" id="orderExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">导出提示</span>
                    <button class="modal-close" onclick="closeModal('orderExportModal')">&times;</button>
                </div>
                <div class="modal-body">
                    已导出订单信息，请到任务中心查看
                </div>
                <div class="modal-footer">
                    <button class="btn-modal primary" onclick="closeModal('orderExportModal')">确认</button>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.innerHTML = orderPageHTML;
    
    // 初始化页面交互
    initializeOrderPage();
}

// 加载订单数据
async function loadOrderData() {
    try {
        showOrderLoading();
        
        const response = await fetch('./data/订单.csv');
        if (response.ok) {
            const csvText = await response.text();
            const orderData = parseCSV(csvText);
            
            // 保存完整数据
            orderFullData = orderData;
            currentData = orderData;
            filteredData = [...orderData];
            
            // 计算分页信息
            orderTotalItems = orderData.length;
            orderTotalPages = Math.ceil(orderTotalItems / orderPageSize);
            orderCurrentPage = 1;
            
            // 更新分页并渲染
            updateOrderPagination();
        } else {
            showOrderEmptyState('订单数据文件未找到');
        }
    } catch (error) {
        console.error('加载订单数据失败:', error);
        showOrderEmptyState('加载订单数据失败');
    }
}

// 渲染订单表格
function renderOrderTable(data) {
    if (!data || data.length === 0) {
        showOrderEmptyState('暂无订单数据');
        return;
    }
    
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) {
        console.error('未找到订单表格体元素');
        return;
    }
    
    const tableHTML = data.map(order => `
        <tr>
            <td class="fixed-column checkbox-column">
                <input type="checkbox" class="row-checkbox" value="${order['订单编号'] || ''}" onchange="updateSelectAllState()">
            </td>
            <td class="fixed-column first">${order['订单编号'] || ''}</td>
            <td>${order['父单编号'] || ''}</td>
            <td>${order['订单来源'] || ''}</td>
            <td>${order['三方单号'] || ''}</td>
            <td>${order['客户PO号'] || ''}</td>
            <td>${order['内贸订单号'] || ''}</td>
            <td>${order['采购单号'] || ''}</td>
            <td>${order['业务模式'] || ''}</td>
            <td>${order['订单状态'] || ''}</td>
            <td>${order['下单账号'] || ''}</td>
            <td>${order['合同号'] || ''}</td>
            <td>${order['客户名称'] || ''}</td>
            <td>${order['币种'] || ''}</td>
            <td>${order['订单金额'] || ''}</td>
            <td>${order['下单时间'] || ''}</td>
            <td>${order['客户审批时间'] || ''}</td>
            <td>${order['付款时间'] || ''}</td>
            <td>${order['订单确认时间'] || ''}</td>
            <td>${order['备货仓名称'] || ''}</td>
            <td>${order['一段运单号'] || ''}</td>
            <td>${order['计划发货时间'] || ''}</td>
            <td>${order['发货时间'] || ''}</td>
            <td>${order['集运中心入仓时间'] || ''}</td>
            <td>${order['集运中心发货时间'] || ''}</td>
            <td>${order['企配名称'] || ''}</td>
            <td>${order['二段运单号'] || ''}</td>
            <td>${order['企配收货时间'] || ''}</td>
            <td>${order['企配发货时间'] || ''}</td>
            <td>${order['实物妥投时间'] || ''}</td>
            <td>${order['承诺送达时间'] || ''}</td>
            <td>${order['计划妥投时间'] || ''}</td>
            <td>${order['签单状态'] || ''}</td>
            <td>${order['系统妥投时间'] || ''}</td>
            <td>${order['完成时间'] || ''}</td>
            <td>${order['hold单状态'] || ''}</td>
            <td class="fixed-action">
                <a href="#" class="action-link" onclick="viewOrderDetail('${order['订单编号'] || ''}')">查看详情</a>
                <a href="#" class="action-link" onclick="printOrder('${order['订单编号'] || ''}')">打印</a>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = tableHTML;
    
    // 初始化批量操作按钮状态
    updateBatchButtonState();
}

// 显示订单加载状态
function showOrderLoading() {
    const tableBody = document.getElementById('orderTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="37" style="text-align: center; padding: 40px;">
                    <div class="loading"></div>
                    <p>正在加载订单数据...</p>
                </td>
            </tr>
        `;
    }
}

// 显示订单空状态
function showOrderEmptyState(message = '暂无订单数据') {
    const tableBody = document.getElementById('orderTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="37" style="text-align: center; padding: 40px;">
                    <p>${message}</p>
                </td>
            </tr>
        `;
    }
}

// 更新订单统计信息
function updateOrderStatistics(totalCount) {
    const totalItemsElement = document.getElementById('orderTotalItems');
    if (totalItemsElement) {
        totalItemsElement.textContent = totalCount;
    }
}

// 更新订单分页
function updateOrderPagination() {
    // 计算分页信息
    orderTotalPages = Math.ceil(orderTotalItems / orderPageSize);
    
    // 获取当前页数据
    const startIndex = (orderCurrentPage - 1) * orderPageSize;
    const endIndex = startIndex + orderPageSize;
    orderPageData = filteredData.slice(startIndex, endIndex);
    
    // 渲染当前页数据
    renderOrderTable(orderPageData);
    
    // 更新分页控件
    renderOrderPaginationControls();
    
    // 更新统计信息
    updateOrderStatistics(orderTotalItems);
}

// 渲染订单分页控件
function renderOrderPaginationControls() {
    const paginationPages = document.getElementById('orderPaginationPages');
    const jumpPageInput = document.getElementById('orderJumpPageInput');
    
    if (!paginationPages || !jumpPageInput) return;
    
    // 更新跳转页面输入框的最大值
    jumpPageInput.max = orderTotalPages;
    jumpPageInput.value = orderCurrentPage;
    
    // 生成页码按钮
    let pagesHTML = '';
    
    // 计算显示的页码范围
    const maxVisiblePages = 7;
    let startPage = Math.max(1, orderCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(orderTotalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 上一页按钮
    if (orderCurrentPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToOrderPage(${orderCurrentPage - 1})">上一页</button>`;
    }
    
    // 第一页
    if (startPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToOrderPage(1)">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === orderCurrentPage ? ' active' : '';
        pagesHTML += `<button class="page-btn${activeClass}" onclick="goToOrderPage(${i})">${i}</button>`;
    }
    
    // 最后一页
    if (endPage < orderTotalPages) {
        if (endPage < orderTotalPages - 1) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
        pagesHTML += `<button class="page-btn" onclick="goToOrderPage(${orderTotalPages})">${orderTotalPages}</button>`;
    }
    
    // 下一页按钮
    if (orderCurrentPage < orderTotalPages) {
        pagesHTML += `<button class="page-btn" onclick="goToOrderPage(${orderCurrentPage + 1})">下一页</button>`;
    }
    
    paginationPages.innerHTML = pagesHTML;
}

// 跳转到指定页面（订单）
function goToOrderPage(page) {
    if (page < 1 || page > orderTotalPages) return;
    
    orderCurrentPage = page;
    updateOrderPagination();
}

// 改变每页显示数量（订单）
function changeOrderPageSize() {
    const pageSizeSelect = document.getElementById('orderPageSizeSelect');
    if (pageSizeSelect) {
        orderPageSize = parseInt(pageSizeSelect.value);
        orderCurrentPage = 1; // 重置到第一页
        updateOrderPagination();
    }
}

// 跳转到指定页面（订单）
function jumpToOrderPage() {
    const jumpPageInput = document.getElementById('orderJumpPageInput');
    if (jumpPageInput) {
        const page = parseInt(jumpPageInput.value);
        if (page >= 1 && page <= orderTotalPages) {
            goToOrderPage(page);
        }
    }
}

// 全选/取消全选功能
function toggleSelectAll(selectAllCheckbox) {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    updateBatchButtonState();
}

// 更新全选状态
function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCount === rowCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    }
    
    updateBatchButtonState();
}

// 更新批量操作按钮状态
function updateBatchButtonState() {
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    const batchButton = document.querySelector('.btn-batch');
    
    if (batchButton) {
        if (checkedCount > 0) {
            batchButton.disabled = false;
            batchButton.textContent = `合单派送 (${checkedCount})`;
        } else {
            batchButton.disabled = true;
            batchButton.textContent = '合单派送';
        }
    }
}

// 获取选中的订单
function getSelectedOrders() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    return Array.from(checkedBoxes).map(checkbox => checkbox.value);
}

// 合单派送功能
function batchDelivery() {
    const selectedOrders = getSelectedOrders();
    
    if (selectedOrders.length === 0) {
        alert('请先选择要合单派送的订单');
        return;
    }
    
    if (selectedOrders.length === 1) {
        alert('合单派送需要选择至少2个订单');
        return;
    }
    
    const confirmMessage = `确定要对以下 ${selectedOrders.length} 个订单进行合单派送吗？\n\n订单编号：\n${selectedOrders.join('\n')}`;
    
    if (confirm(confirmMessage)) {
        console.log('执行合单派送:', selectedOrders);
        // 这里可以添加实际的合单派送逻辑
        alert(`已成功提交 ${selectedOrders.length} 个订单的合单派送请求`);
        
        // 清除选择状态
        document.getElementById('selectAll').checked = false;
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateBatchButtonState();
    }
}

// 初始化订单列表页面交互
function initializeOrderPage() {
    const expandToggle = document.getElementById('orderExpandToggle');
    const formContent = document.getElementById('orderFormContent');
    
    if (expandToggle && formContent) {
        expandToggle.addEventListener('click', function() {
            const isExpanded = formContent.classList.contains('expanded');
            if (isExpanded) {
                formContent.classList.remove('expanded');
                expandToggle.textContent = '展开';
            } else {
                formContent.classList.add('expanded');
                expandToggle.textContent = '收起';
            }
        });
    }
    
    // 加载客户数据到下拉框
    loadOrderCustomerOptions();
}

// 加载订单页面的客户选项
async function loadOrderCustomerOptions() {
    try {
        const customerData = await loadCustomerConfigData();
        const customerSelect = document.getElementById('customerName');
        
        if (!customerSelect) return;
        
        if (customerData.length > 0) {
            // 清空现有选项（保留第一个"请选择或输入"选项）
            customerSelect.innerHTML = '<option value="">请选择或输入</option>';
            
            // 去重客户名称
            const uniqueCustomers = [...new Set(customerData
                .map(customer => customer.clientName)
                .filter(name => name && name.trim())
            )];
            
            // 添加客户选项
            uniqueCustomers.forEach(customerName => {
                const option = document.createElement('option');
                option.value = customerName;
                option.textContent = customerName;
                customerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载客户选项失败:', error);
    }
}

// 重置订单搜索表单
function resetOrderSearchForm() {
    const form = document.querySelector('.order-search-container');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'date' || input.tagName === 'INPUT') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (input.tagName === 'TEXTAREA') {
                input.value = '';
            }
        });
    }
    
    // 重置筛选数据，显示所有订单
    if (currentData && currentData.length > 0) {
        filteredData = [...currentData];
        
        // 重置分页信息
        orderTotalItems = filteredData.length;
        orderTotalPages = Math.ceil(orderTotalItems / orderPageSize);
        orderCurrentPage = 1;
        
        // 更新分页并渲染数据
        updateOrderPagination();
        
        // 重置选择状态
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        updateBatchButtonState();
    }
}

// 查询订单列表
function searchOrders() {
    console.log('执行订单查询...');
    
    if (!currentData || currentData.length === 0) {
        showOrderEmptyState('没有数据可以查询');
        return;
    }
    
    // 获取搜索条件
    const searchConditions = {
        orderNumbers: document.getElementById('orderNumbers')?.value.trim(),
        parentOrderNumbers: document.getElementById('parentOrderNumbers')?.value.trim(),
        thirdPartyOrderNumbers: document.getElementById('thirdPartyOrderNumbers')?.value.trim(),
        orderType: document.getElementById('orderType')?.value,
        orderStatus: document.getElementById('orderStatus')?.value,
        isCustoms: document.getElementById('isCustoms')?.value,
        contractNumber: document.getElementById('contractNumber')?.value.trim(),
        customerName: document.getElementById('customerName')?.value,
        customerType: document.getElementById('customerType')?.value,
        domesticOrderNumbers: document.getElementById('domesticOrderNumbers')?.value.trim(),
        purchaseOrderNumbers: document.getElementById('purchaseOrderNumbers')?.value.trim(),
        orderAccount: document.getElementById('orderAccount')?.value,
        customerPO: document.getElementById('customerPO')?.value.trim(),
        orderDateStart: document.getElementById('orderDateStart')?.value,
        orderDateEnd: document.getElementById('orderDateEnd')?.value,
        enterpriseWarehouse: document.getElementById('enterpriseWarehouse')?.value,
        stockWarehouse: document.getElementById('stockWarehouse')?.value,
        stockWarehouseStatus: document.getElementById('stockWarehouseStatus')?.value,
        enterpriseReceiveStart: document.getElementById('enterpriseReceiveStart')?.value,
        enterpriseReceiveEnd: document.getElementById('enterpriseReceiveEnd')?.value,
        outboundNumber: document.getElementById('outboundNumber')?.value.trim(),
        firstSegmentInStart: document.getElementById('firstSegmentInStart')?.value,
        firstSegmentInEnd: document.getElementById('firstSegmentInEnd')?.value,
        hasSecondSegment: document.getElementById('hasSecondSegment')?.value,
        signStatus: document.getElementById('signStatus')?.value,
        holdStatus: document.getElementById('holdStatus')?.value
    };
    
    // 过滤数据
    filteredData = currentData.filter(order => {
        // 订单编号筛选（支持多个）
        if (searchConditions.orderNumbers) {
            const orderNums = searchConditions.orderNumbers.split('\n').map(s => s.trim()).filter(s => s);
            const matches = orderNums.some(num => (order['订单编号'] || '').includes(num));
            if (!matches) return false;
        }
        
        // 父单号筛选（支持多个）
        if (searchConditions.parentOrderNumbers) {
            const parentNums = searchConditions.parentOrderNumbers.split('\n').map(s => s.trim()).filter(s => s);
            const matches = parentNums.some(num => (order['父单编号'] || '').includes(num));
            if (!matches) return false;
        }
        
        // 第三方订单号筛选（支持多个）
        if (searchConditions.thirdPartyOrderNumbers) {
            const thirdPartyNums = searchConditions.thirdPartyOrderNumbers.split('\n').map(s => s.trim()).filter(s => s);
            const matches = thirdPartyNums.some(num => (order['三方单号'] || '').includes(num));
            if (!matches) return false;
        }
        
        // 其他单个条件筛选
        if (searchConditions.orderType && order['业务模式'] !== searchConditions.orderType) return false;
        if (searchConditions.orderStatus && order['订单状态'] !== searchConditions.orderStatus) return false;
        if (searchConditions.contractNumber && !(order['合同号'] || '').includes(searchConditions.contractNumber)) return false;
        if (searchConditions.customerName && !(order['客户名称'] || '').includes(searchConditions.customerName)) return false;
        if (searchConditions.orderAccount && order['下单账号'] !== searchConditions.orderAccount) return false;
        if (searchConditions.customerPO && !(order['客户PO号'] || '').includes(searchConditions.customerPO)) return false;
        if (searchConditions.enterpriseWarehouse && order['企配名称'] !== searchConditions.enterpriseWarehouse) return false;
        if (searchConditions.stockWarehouse && order['备货仓名称'] !== searchConditions.stockWarehouse) return false;
        if (searchConditions.signStatus && order['签单状态'] !== searchConditions.signStatus) return false;
        if (searchConditions.holdStatus && order['hold单状态'] !== searchConditions.holdStatus) return false;
        
        // 日期范围筛选
        if (searchConditions.orderDateStart || searchConditions.orderDateEnd) {
            const orderDate = order['下单时间'];
            if (orderDate) {
                // 转换日期格式为可比较的格式
                const orderDateTime = new Date(orderDate.replace(/\//g, '-')).getTime();
                if (searchConditions.orderDateStart) {
                    const startTime = new Date(searchConditions.orderDateStart).getTime();
                    if (orderDateTime < startTime) return false;
                }
                if (searchConditions.orderDateEnd) {
                    const endTime = new Date(searchConditions.orderDateEnd).getTime();
                    if (orderDateTime > endTime) return false;
                }
            }
        }
        
        return true;
    });
    
    // 更新分页信息并渲染
    orderTotalItems = filteredData.length;
    orderTotalPages = Math.ceil(orderTotalItems / orderPageSize);
    orderCurrentPage = 1; // 重置到第一页
    
    // 更新分页并渲染数据
    updateOrderPagination();
    
    // 重置选择状态
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    updateBatchButtonState();
    
    console.log(`查询完成，找到 ${filteredData.length} 条记录`);
}

// 导出订单列表
function exportOrders() {
    const modal = document.getElementById('exportFieldsModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 显示列选择器
function showColumnSelector() {
    const modal = document.getElementById('columnSelectorModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 导出字段选择相关函数
function selectAllFields() {
    const checkboxes = document.querySelectorAll('#exportFieldsModal input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function clearAllFields() {
    const checkboxes = document.querySelectorAll('#exportFieldsModal input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function confirmExportFields() {
    const selectedFields = [];
    const checkboxes = document.querySelectorAll('#exportFieldsModal input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedFields.push(checkbox.value);
    });
    
    console.log('导出字段:', selectedFields);
    
    // 关闭字段选择模态框
    closeModal('exportFieldsModal');
    
    // 显示导出确认模态框
    const confirmModal = document.getElementById('orderExportModal');
    if (confirmModal) {
        confirmModal.classList.add('show');
    }
}

// 列显示选择相关函数
function selectAllColumns() {
    const checkboxes = document.querySelectorAll('#columnSelectorModal input[type="checkbox"]:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function clearAllColumns() {
    const checkboxes = document.querySelectorAll('#columnSelectorModal input[type="checkbox"]:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function confirmColumnSelection() {
    const selectedColumns = [];
    const checkboxes = document.querySelectorAll('#columnSelectorModal input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedColumns.push(checkbox.value);
    });
    
    console.log('显示列:', selectedColumns);
    
    // 这里可以添加隐藏/显示列的逻辑
    updateTableColumns(selectedColumns);
    
    closeModal('columnSelectorModal');
}

function updateTableColumns(selectedColumns) {
    // 获取表格的所有列
    const table = document.querySelector('.order-table');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');
    
    // 列映射
    const columnMap = {
        'orderNumber': 0,
        'parentOrderNumber': 1,
        'orderSource': 2,
        'thirdPartyNumber': 3,
        'customerPO': 4,
        'domesticOrderNumber': 5,
        'purchaseOrderNumber': 6,
        'businessMode': 7,
        'orderStatus': 8,
        'orderAccount': 9,
        'contractNumber': 10,
        'customerName': 11,
        'currency': 12,
        'orderAmount': 13,
        'orderTime': 14,
        'customerApprovalTime': 15,
        'paymentTime': 16,
        'orderConfirmTime': 17,
        'stockWarehouseName': 18,
        'firstSegmentNumber': 19,
        'plannedShipTime': 20,
        'shipTime': 21,
        'consolidationInTime': 22,
        'consolidationOutTime': 23,
        'enterpriseName': 24,
        'secondSegmentNumber': 25,
        'enterpriseReceiveTime': 26,
        'enterpriseShipTime': 27,
        'actualDeliveryTime': 28,
        'promisedDeliveryTime': 29,
        'plannedDeliveryTime': 30,
        'signStatus': 31,
        'systemDeliveryTime': 32,
        'completeTime': 33,
        'holdStatus': 34,
        'actions': 35
    };
    
    // 隐藏/显示列
    Object.keys(columnMap).forEach(columnKey => {
        const columnIndex = columnMap[columnKey];
        const isVisible = selectedColumns.includes(columnKey);
        
        // 显示/隐藏表头
        if (headers[columnIndex]) {
            headers[columnIndex].style.display = isVisible ? '' : 'none';
        }
        
        // 显示/隐藏数据行
        rows.forEach(row => {
            const cell = row.children[columnIndex];
            if (cell) {
                cell.style.display = isVisible ? '' : 'none';
            }
        });
    });
}

// 订单相关操作函数
function viewOrderDetail(orderNo) {
    alert(`查看订单 ${orderNo} 的详细信息`);
}

function printOrder(orderNo) {
    alert(`打印订单 ${orderNo}`);
}

// 订单分页相关函数
function goToOrderPage(page) {
    console.log('跳转到订单页面:', page);
}

function changeOrderPageSize() {
    console.log('改变订单页面大小');
}

function jumpToOrderPage() {
    const input = document.getElementById('orderJumpPageInput');
    if (input) {
        const page = parseInt(input.value);
        goToOrderPage(page);
    }
}

// 初始化异常列表页面交互
function initializeExceptionPage() {
    const expandToggle = document.getElementById('expandToggle');
    const formContent = document.getElementById('formContent');
    
    // 默认展开查询条件
    if (formContent) {
        formContent.classList.add('expanded');
    }
    if (expandToggle) {
        expandToggle.textContent = '收起';
    }
    
    if (expandToggle && formContent) {
        expandToggle.addEventListener('click', function() {
            const isExpanded = formContent.classList.contains('expanded');
            if (isExpanded) {
                formContent.classList.remove('expanded');
                expandToggle.textContent = '展开';
            } else {
                formContent.classList.add('expanded');
                expandToggle.textContent = '收起';
            }
        });
    }
    
    // 首先加载客户数据到下拉框，然后初始化分页
    loadCustomerOptions().then(() => {
        // 初始化分页
        initExceptionPagination();
    }).catch(() => {
        // 如果加载客户选项失败，仍然初始化分页
        initExceptionPagination();
    });
}

// 加载客户选项到下拉框
async function loadCustomerOptions() {
    try {
        console.log('开始加载客户选项...');
        const customerData = await loadCustomerConfigData();
        const customerSelect = document.getElementById('customerName');
        
        if (!customerSelect) {
            console.error('找不到customerName下拉框元素');
            return;
        }
        
        if (customerData.length > 0) {
            console.log('正在填充客户简码选项，共', customerData.length, '个客户记录');
            
            // 清空现有选项（保留第一个"请选择或输入"选项）
            customerSelect.innerHTML = '<option value="">请选择或输入</option>';
            
            // 去重客户简码，并过滤空值
            const uniqueClientCodes = [...new Set(customerData
                .map(customer => customer.clientCode)
                .filter(code => code && code.trim())
            )];
            
            console.log('去重后的客户简码数量:', uniqueClientCodes.length);
            
            // 添加客户选项（显示clientCode）
            uniqueClientCodes.forEach(clientCode => {
                const option = document.createElement('option');
                option.value = clientCode;
                option.textContent = clientCode;
                customerSelect.appendChild(option);
            });
            
            console.log('成功加载客户选项，共', uniqueClientCodes.length, '个客户简码');
        } else {
            console.warn('没有加载到客户数据');
        }
    } catch (error) {
        console.error('加载客户选项失败:', error);
        // 保持默认的客户选项
    }
}

// 重置搜索表单
function resetSearchForm() {
    const form = document.querySelector('.exception-search-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'date' || input.tagName === 'INPUT') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (input.tagName === 'TEXTAREA') {
                input.value = '';
            }
        });
    }
}

// 查询异常列表
function searchExceptions() {
    // 这里可以添加查询逻辑
    console.log('执行异常查询...');
    
    // 模拟查询过程
    const tableBody = document.getElementById('exceptionTableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 20px;">正在查询异常数据...</td></tr>';
        
        // 模拟异步查询
        setTimeout(() => {
            // 重新初始化分页数据
            exceptionCurrentPage = 1;
            initExceptionPagination();
        }, 1000);
    }
}

// 导出异常列表
function exportExceptions() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 查看异常详情
function viewExceptionDetail(orderNo) {
    alert(`查看订单 ${orderNo} 的异常详情`);
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// 加载客户配置数据
async function loadCustomerConfigData() {
    try {
        const response = await fetch('./data/客户配置_20250722095454_lizimeng16_保密信息_请勿外传.csv');
        if (!response.ok) {
            throw new Error('客户配置文件加载失败');
        }
        
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const customerData = [];
        
        // 跳过第一行标题
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            try {
                // 分割CSV行，处理JSON字段
                const columns = line.split(',');
                if (columns.length >= 3) {
                    const duccInfoStr = columns[0];
                    // 解析JSON字符串
                    const duccInfo = JSON.parse(duccInfoStr.replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"'));
                    
                    customerData.push({
                        clientName: duccInfo.clientName || '',
                        clientCode: duccInfo.clientCode || '',
                        country: duccInfo.country || '',
                        pin: duccInfo.pin || '',
                        contractCode: duccInfo.contractCode || ''
                    });
                }
            } catch (parseError) {
                console.warn('解析客户配置行失败:', parseError, '行内容:', line);
            }
        }
        
        console.log('成功加载客户配置数据，共', customerData.length, '条记录');
        return customerData;
    } catch (error) {
        console.error('加载客户配置数据失败:', error);
        throw error;
    }
}

// 默认异常数据初始化（当客户配置加载失败时使用）
function initDefaultExceptionData() {
    const mockExceptionData = [];
    const exceptionTypes = [
        '超期未审批',
        '超期未确认', 
        '超期未发货',
        '超期未到集运',
        '集运超期未发运',
        '超期未报关',
        '超期未离港',
        '超期未到港',
        '超期未清关',
        '超期未到企配',
        '超期未派送',
        '超期未妥投',
        '签单超期未合格',
        '超期未完成'
    ];
    
    for (let i = 1; i <= 156; i++) {
        mockExceptionData.push({
            orderNo: `ORD2024070${String(i).padStart(4, '0')}`,
            orderType: ['跨境直发', '本本直发', '备货仓发', '备货入库'][i % 4],
            country: ['泰国', '越南', '马来西亚', '印尼', '巴西', '匈牙利'][i % 6],
            customer: ['hRvDgUX263Y2FuWbVzB8', 'yPpvH0qjoPodSR8M4LCb', 'tPpvH0qjoPodSR8M4LCt'][i % 3], // 使用clientCode格式
            orderTime: `2024-07-${String(Math.floor(i/5) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            promiseShipTime: `2024-07-${String(Math.floor(i/5) + 3).padStart(2, '0')} 18:00`,
            promiseDeliveryTime: `2024-07-${String(Math.floor(i/5) + 8).padStart(2, '0')} 18:00`,
            exceptionStage: ['订单创建', '订单已审批', '订单确认', '商品发货', '集运中心收货', '集运中心发货', '起运国离港', '目的国到港', '目的港清关', '企配中心收货', '企配中心发货', '订单派送', '订单妥投', '签单审批通过', '订单完成'][i % 15],
            exceptionType: exceptionTypes[i % exceptionTypes.length],
            exceptionStatus: ['处理中', '已关闭', '待处理'][i % 3],
            exceptionStartTime: `2024-07-${String(Math.floor(i/5) + 4).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            exceptionCloseTime: i % 3 === 1 ? `2024-07-${String(Math.floor(i/5) + 5).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '-',
            womsNo: `WOMS202407${String(i).padStart(4, '0')}`
        });
    }
    
    exceptionTotalItems = mockExceptionData.length;
    exceptionTotalPages = Math.ceil(exceptionTotalItems / exceptionPageSize);
    exceptionPageData = mockExceptionData;
    
    updateExceptionTable();
    updatePaginationInfo();
}

// 分页相关函数
function initExceptionPagination() {
    // 首先加载客户配置数据
    loadCustomerConfigData().then(customerData => {
        // 模拟异常数据
        const mockExceptionData = [];
        const exceptionTypes = [
            '超期未审批',
            '超期未确认', 
            '超期未发货',
            '超期未到集运',
            '集运超期未发运',
            '超期未报关',
            '超期未离港',
            '超期未到港',
            '超期未清关',
            '超期未到企配',
            '超期未派送',
            '超期未妥投',
            '签单超期未合格',
            '超期未完成'
        ];
        
        // 国家代码映射
        const countryMapping = {
            'TH': '泰国',
            'MY': '马来西亚', 
            'HK': '香港',
            'CN': '中国',
            'VN': '越南',
            'BR': '巴西',
            'HU': '匈牙利',
            'ID': '印度尼西亚'
        };
        
        for (let i = 1; i <= 156; i++) {
            // 从客户配置中随机选择一个客户
            const randomCustomer = customerData[i % customerData.length];
            const countryCode = randomCustomer.country;
            const countryName = countryMapping[countryCode] || countryCode;
            
            mockExceptionData.push({
                orderNo: `ORD2024070${String(i).padStart(4, '0')}`,
                orderType: ['跨境直发', '本本直发', '备货仓发', '备货入库'][i % 4],
                country: countryName,
                customer: randomCustomer.clientCode, // 使用clientCode而不是clientName
                orderTime: `2024-07-${String(Math.floor(i/5) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                promiseShipTime: `2024-07-${String(Math.floor(i/5) + 3).padStart(2, '0')} 18:00`,
                promiseDeliveryTime: `2024-07-${String(Math.floor(i/5) + 8).padStart(2, '0')} 18:00`,
                exceptionStage: ['订单创建', '订单已审批', '订单确认', '商品发货', '集运中心收货', '集运中心发货', '起运国离港', '目的国到港', '目的港清关', '企配中心收货', '企配中心发货', '订单派送', '订单妥投', '签单审批通过', '订单完成'][i % 15],
                exceptionType: exceptionTypes[i % exceptionTypes.length],
                exceptionStatus: ['处理中', '已关闭', '待处理'][i % 3],
                exceptionStartTime: `2024-07-${String(Math.floor(i/5) + 4).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                exceptionCloseTime: i % 3 === 1 ? `2024-07-${String(Math.floor(i/5) + 5).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '-',
                womsNo: `WOMS202407${String(i).padStart(4, '0')}`
            });
        }
        
        exceptionTotalItems = mockExceptionData.length;
        exceptionTotalPages = Math.ceil(exceptionTotalItems / exceptionPageSize);
        exceptionPageData = mockExceptionData;
        
        updateExceptionTable();
        updatePaginationInfo();
    }).catch(error => {
        console.error('加载客户配置数据失败:', error);
        // 如果加载失败，使用默认数据
        initDefaultExceptionData();
    });
}

function updateExceptionTable() {
    const startIndex = (exceptionCurrentPage - 1) * exceptionPageSize;
    const endIndex = startIndex + exceptionPageSize;
    const currentPageData = exceptionPageData.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('exceptionTableBody');
    if (!tableBody) return;
    
    let tableHTML = '';
    currentPageData.forEach(item => {
        tableHTML += `
            <tr>
                <td class="fixed-column first">${item.orderNo}</td>
                <td>${item.orderType}</td>
                <td>${item.country}</td>
                <td>${item.customer}</td>
                <td>${item.orderTime}</td>
                <td>${item.promiseShipTime}</td>
                <td>${item.promiseDeliveryTime}</td>
                <td>${item.exceptionStage}</td>
                <td>${item.exceptionType}</td>
                <td>${item.exceptionStatus}</td>
                <td>${item.exceptionStartTime}</td>
                <td>${item.exceptionCloseTime}</td>
                <td>${item.womsNo}</td>
                <td class="fixed-column last">
                    <a href="#" class="action-link" onclick="viewExceptionDetail('${item.orderNo}')">详情</a>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
}

function updatePaginationInfo() {
    // 更新总数显示
    const totalItemsSpan = document.getElementById('totalItems');
    if (totalItemsSpan) {
        totalItemsSpan.textContent = exceptionTotalItems;
    }
    
    // 更新页码按钮
    const paginationPages = document.getElementById('paginationPages');
    if (!paginationPages) return;
    
    let pagesHTML = '';
    
    // 上一页按钮
    if (exceptionCurrentPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToPage(${exceptionCurrentPage - 1})">上一页</button>`;
    } else {
        pagesHTML += `<button class="page-btn disabled">上一页</button>`;
    }
    
    // 页码按钮逻辑
    let startPage = Math.max(1, exceptionCurrentPage - 2);
    let endPage = Math.min(exceptionTotalPages, exceptionCurrentPage + 2);
    
    if (startPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === exceptionCurrentPage ? ' active' : '';
        pagesHTML += `<button class="page-btn${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < exceptionTotalPages) {
        if (endPage < exceptionTotalPages - 1) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
        pagesHTML += `<button class="page-btn" onclick="goToPage(${exceptionTotalPages})">${exceptionTotalPages}</button>`;
    }
    
    // 下一页按钮
    if (exceptionCurrentPage < exceptionTotalPages) {
        pagesHTML += `<button class="page-btn" onclick="goToPage(${exceptionCurrentPage + 1})">下一页</button>`;
    } else {
        pagesHTML += `<button class="page-btn disabled">下一页</button>`;
    }
    
    paginationPages.innerHTML = pagesHTML;
    
    // 更新跳转页面输入框的max属性
    const jumpPageInput = document.getElementById('jumpPageInput');
    if (jumpPageInput) {
        jumpPageInput.max = exceptionTotalPages;
        jumpPageInput.value = exceptionCurrentPage;
    }
}

function goToPage(page) {
    if (page < 1 || page > exceptionTotalPages || page === exceptionCurrentPage) {
        return;
    }
    
    exceptionCurrentPage = page;
    updateExceptionTable();
    updatePaginationInfo();
}

function changePageSize() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (!pageSizeSelect) return;
    
    exceptionPageSize = parseInt(pageSizeSelect.value);
    exceptionTotalPages = Math.ceil(exceptionTotalItems / exceptionPageSize);
    exceptionCurrentPage = 1; // 重置到第一页
    
    updateExceptionTable();
    updatePaginationInfo();
}

function jumpToPage() {
    const jumpPageInput = document.getElementById('jumpPageInput');
    if (!jumpPageInput) return;
    
    const targetPage = parseInt(jumpPageInput.value);
    if (isNaN(targetPage) || targetPage < 1 || targetPage > exceptionTotalPages) {
        alert(`请输入1到${exceptionTotalPages}之间的页码`);
        jumpPageInput.value = exceptionCurrentPage;
        return;
    }
    
    goToPage(targetPage);
}

// HTML转义函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
