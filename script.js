// 全局变量
let currentPage = '';
let currentData = [];
let filteredData = [];

// 订单状态选项常量
const ORDER_STATUS_OPTIONS = [
    { value: "", text: "请选择" },
    { value: "提单", text: "提单" },
    { value: "已取消", text: "已取消" },
    { value: "客户审批完成", text: "客户审批完成" },
    { value: "运营已确认", text: "运营已确认" },
    { value: "已提交ept订单", text: "已提交ept订单" },
    { value: "已取消内贸段订单", text: "已取消内贸段订单" },
    { value: "已确认跨境采购单", text: "已确认跨境采购单" },
    { value: "已确认", text: "已确认" },
    { value: "已发货", text: "已发货" },
    { value: "已收货", text: "已收货" },
    { value: "已妥投", text: "已妥投" },
    { value: "已完成", text: "已完成" },
    { value: "商品数据问题，订单下传失败", text: "商品数据问题，订单下传失败" },
    { value: "已取消跨境采购单", text: "已取消跨境采购单" },
    { value: "已提交跨境采购单", text: "已提交跨境采购单" },
    { value: "已取消本土采购单", text: "已取消本土采购单" },
    { value: "已提交本土采购单", text: "已提交本土采购单" }
];

// Tab页和订单状态的映射关系
const TAB_STATUS_MAPPING = {
    'all': [], // 全部：显示所有状态
    '待审批': ['提单', '运营已确认'],
    '待确认': ['客户审批完成', '商品数据问题，订单下传失败', '已提交跨境采购单', '已取消跨境采购单'],
    '待发货': ['已确认跨境采购单', '已确认'],
    '待集运收': ['已发货'],
    '待集运发': ['已发货'],
    '待企配收': ['已发货'],
    '待企配发': ['已发货'],
    '待妥投': ['已发货'],
    '待完成': ['已收货', '已妥投'],
    '已完成': ['已完成']
};

// 生成订单状态选择器选项的模板字符串（全部选项）
const ORDER_STATUS_OPTIONS_HTML = ORDER_STATUS_OPTIONS.map(option => 
    `                            <option value="${option.value}">${option.text}</option>`
).join('\n');

// 根据Tab页生成对应的订单状态选项
function generateOrderStatusOptionsForTab(tabStatus) {
    if (tabStatus === 'all' || !TAB_STATUS_MAPPING[tabStatus]) {
        // 显示所有选项
        return ORDER_STATUS_OPTIONS_HTML;
    }
    
    // 显示Tab页对应的状态选项
    const allowedStatuses = TAB_STATUS_MAPPING[tabStatus];
    const filteredOptions = ORDER_STATUS_OPTIONS.filter(option => 
        option.value === "" || allowedStatuses.includes(option.value)
    );
    
    return filteredOptions.map(option => 
        `                            <option value="${option.value}">${option.text}</option>`
    ).join('\n');
}

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

// 各国订单列表分页相关变量
const countryOrderData = {
    '泰国': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '越南': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '马来西亚': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '印度尼西亚': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '巴西': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '匈牙利': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    },
    '香港': {
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 0,
        pageData: [],
        fullData: []
    }
};

// 通用列表分页相关变量
let generalCurrentPage = 1;
let generalPageSize = 20;
let generalTotalPages = 1;
let generalTotalItems = 0;
let generalPageData = [];

// 末端派送列表分页相关变量
let deliveryCurrentPage = 1;
let deliveryPageSize = 20;
let deliveryTotalPages = 1;
let deliveryTotalItems = 0;
let deliveryPageData = [];
let deliveryFullData = [];

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
        // 订单列表已禁用，显示提示信息
        renderExceptionListPage();
    } else if (pageName === '泰国订单列表') {
        renderCountryOrderListPage('泰国');
    } else if (pageName === '越南订单列表') {
        renderCountryOrderListPage('越南');
    } else if (pageName === '马来订单列表') {
        renderCountryOrderListPage('马来西亚');
    } else if (pageName === '印度尼西亚订单列表') {
        renderCountryOrderListPage('印度尼西亚');
    } else if (pageName === '巴西订单列表') {
        renderCountryOrderListPage('巴西');
    } else if (pageName === '匈牙利订单列表') {
        renderCountryOrderListPage('匈牙利');
    } else if (pageName === '香港订单列表') {
        renderCountryOrderListPage('香港');
    } else if (pageName === '末端派送列表') {
        renderDeliveryListPage();
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
${ORDER_STATUS_OPTIONS_HTML}
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

// 渲染指定国家的订单列表页面
function renderCountryOrderListPage(country) {
    // 隐藏默认搜索容器
    document.querySelector('.search-container').style.display = 'none';
    
    // 直接复用原来的订单页面结构
    renderOrderPageStructure();
    
    // 然后加载该国家的订单数据
    loadCountryOrderData(country);
}

// 渲染订单页面结构
function renderOrderPageStructure() {
    
    const orderPageHTML = `
        <!-- 订单状态 Tab 分页 -->
        <div class="order-status-tabs-container">
            <div class="order-status-tabs">
                <div class="tab-item active" data-status="all" onclick="switchOrderStatusTab('all', this)">
                    <span class="tab-label">全部</span>
                    <span class="tab-badge" id="badge-all">0</span>
                </div>
                <div class="tab-item" data-status="待审批" onclick="switchOrderStatusTab('待审批', this)">
                    <span class="tab-label">待审批</span>
                    <span class="tab-badge" id="badge-待审批">0</span>
                </div>
                <div class="tab-item" data-status="待确认" onclick="switchOrderStatusTab('待确认', this)">
                    <span class="tab-label">待确认</span>
                    <span class="tab-badge" id="badge-待确认">0</span>
                </div>
                <div class="tab-item" data-status="待发货" onclick="switchOrderStatusTab('待发货', this)">
                    <span class="tab-label">待发货</span>
                    <span class="tab-badge" id="badge-待发货">0</span>
                </div>
                <div class="tab-item" data-status="待集运收" onclick="switchOrderStatusTab('待集运收', this)">
                    <span class="tab-label">待集运收</span>
                    <span class="tab-badge" id="badge-待集运收">0</span>
                </div>
                <div class="tab-item" data-status="待集运发" onclick="switchOrderStatusTab('待集运发', this)">
                    <span class="tab-label">待集运发</span>
                    <span class="tab-badge" id="badge-待集运发">0</span>
                </div>
                <div class="tab-item" data-status="待企配收" onclick="switchOrderStatusTab('待企配收', this)">
                    <span class="tab-label">待企配收</span>
                    <span class="tab-badge" id="badge-待企配收">0</span>
                </div>
                <div class="tab-item" data-status="待企配发" onclick="switchOrderStatusTab('待企配发', this)">
                    <span class="tab-label">待企配发</span>
                    <span class="tab-badge" id="badge-待企配发">0</span>
                </div>
                <div class="tab-item" data-status="待妥投" onclick="switchOrderStatusTab('待妥投', this)">
                    <span class="tab-label">待妥投</span>
                    <span class="tab-badge" id="badge-待妥投">0</span>
                </div>
                <div class="tab-item" data-status="待完成" onclick="switchOrderStatusTab('待完成', this)">
                    <span class="tab-label">待完成</span>
                    <span class="tab-badge" id="badge-待完成">0</span>
                </div>
                <div class="tab-item" data-status="已完成" onclick="switchOrderStatusTab('已完成', this)">
                    <span class="tab-label">已完成</span>
                    <span class="tab-badge" id="badge-已完成">0</span>
                </div>
            </div>
        </div>

        <!-- 条件查询搜索框 -->
        <div class="order-search-container" style="font-size: 12px;">
            <div class="order-search-header">
                <span class="order-search-title">查询条件</span>
                <button class="order-expand-toggle" id="orderExpandToggle">收起</button>
            </div>
            <div class="order-form-content expanded" id="orderFormContent">
                <div class="order-search-form">
                    <!-- 第一行 -->
                    <div class="order-form-group">
                        <label>订单编号</label>
                        <textarea id="orderNumbers" placeholder="请输入订单编号，支持多个单号换行输入" rows="3"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>父单号</label>
                        <textarea id="parentOrderNumbers" placeholder="请输入父单号，支持多个单号换行输入" rows="3"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>第三方订单号</label>
                        <textarea id="thirdPartyOrderNumbers" placeholder="请输入第三方订单编号，支持多个单号换行输入" rows="3"></textarea>
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
${ORDER_STATUS_OPTIONS_HTML}
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
                        <textarea id="domesticOrderNumbers" placeholder="请输入内贸段订单编号，支持多个单号换行输入" rows="3"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>采购单号</label>
                        <textarea id="purchaseOrderNumbers" placeholder="请输入采购单号，支持多个单号换行输入" rows="3"></textarea>
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
                            <option value="warehouse_manager">warehouse_manager</option>
                            <option value="finance_user">finance_user</option>
                            <option value="quality_inspector">quality_inspector</option>
                            <option value="export_specialist">export_specialist</option>
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
                            <!-- 企配仓选项将通过loadEnterpriseWarehouseOptions()函数动态加载 -->
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>备货仓名称</label>
                        <select id="stockWarehouse" style="width: 100%;">
                            <option value="">请选择</option>
                            <!-- 备货仓选项将通过loadStockWarehouseOptions()函数动态加载 -->
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
                    </div>
                    <div class="order-form-group"></div> <!-- 占位符保持对齐 -->
                </div>
            </div>
        </div>

        <!-- 订单列表 -->
        <div class="order-table-container">
            <div class="order-table-header">
                <div class="order-table-tools">
                    <div class="left-tools">
                        <button class="btn-batch" onclick="batchDelivery()">合单派送</button>
                        <button class="btn-export" onclick="exportOrders()">导出</button>
                    </div>
                    <div class="right-tools">
                        <button class="btn-columns" onclick="showColumnSelector()"title="表格字段显隐">
                            <svg class="gear-icon" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" fill="currentColor"/>
                            </svg>
                        </button>
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
            
            // 更新订单状态 Tab 徽标
            updateOrderStatusTabBadges();
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
    
    // 初始化订单状态下拉框（默认显示所有选项）
    updateOrderStatusDropdown('all');
    
    // 加载所有下拉框数据
    loadOrderCustomerOptions();
    loadOrderEnterpriseWarehouseOptions();
    loadOrderStockWarehouseOptions();
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

// 加载订单页面的企配仓选项
async function loadOrderEnterpriseWarehouseOptions() {
    try {
        const warehouseSelect = document.getElementById('enterpriseWarehouse');
        if (!warehouseSelect) return;
        
        // 模拟企配仓数据
        const enterpriseWarehouses = [
            '北京企配仓1号',
            '上海企配仓2号', 
            '广州企配仓3号',
            '深圳企配仓4号',
            '成都企配仓5号',
            '杭州企配仓6号',
            '武汉企配仓7号',
            '西安企配仓8号'
        ];
        
        // 清空现有选项
        warehouseSelect.innerHTML = '<option value="">请选择</option>';
        
        // 添加企配仓选项
        enterpriseWarehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse;
            option.textContent = warehouse;
            warehouseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载企配仓选项失败:', error);
    }
}

// 加载订单页面的备货仓选项
async function loadOrderStockWarehouseOptions() {
    try {
        const warehouseSelect = document.getElementById('stockWarehouse');
        if (!warehouseSelect) return;
        
        // 模拟备货仓数据
        const stockWarehouses = [
            '泰国中心仓1号（林查班）',
            '泰国中心仓2号（曼谷）',
            '越南中心仓1号（胡志明）',
            '越南中心仓2号（河内）',
            '马来西亚中心仓（吉隆坡）',
            '印尼中心仓（雅加达）',
            '巴西中心仓（圣保罗）',
            '匈牙利中心仓（布达佩斯）'
        ];
        
        // 清空现有选项
        warehouseSelect.innerHTML = '<option value="">请选择</option>';
        
        // 添加备货仓选项
        stockWarehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse;
            option.textContent = warehouse;
            warehouseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载备货仓选项失败:', error);
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

// 当前选中的订单状态 Tab
let currentOrderStatusTab = 'all';

// 切换订单状态 Tab
function switchOrderStatusTab(status, tabElement) {
    // 更新当前选中的状态
    currentOrderStatusTab = status;
    
    // 更新 Tab 样式
    const tabs = document.querySelectorAll('.order-status-tabs .tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');
    
    // 更新订单状态搜索框的选项（联动功能）
    updateOrderStatusDropdown(status);
    
    // 根据状态筛选数据
    filterOrdersByStatus(status);
    
    console.log(`切换到订单状态: ${status}`);
}

// 更新订单状态下拉框选项（Tab联动功能）
function updateOrderStatusDropdown(tabStatus) {
    const orderStatusSelect = document.getElementById('orderStatus');
    if (!orderStatusSelect) return;
    
    // 生成对应Tab的订单状态选项
    const newOptionsHTML = generateOrderStatusOptionsForTab(tabStatus);
    
    // 清空并重新填充选项
    orderStatusSelect.innerHTML = newOptionsHTML;
    
    // 重置选择值
    orderStatusSelect.value = '';
    
    console.log(`订单状态下拉框已更新为Tab: ${tabStatus} 对应的选项`);
}

// 根据状态筛选订单
function filterOrdersByStatus(status) {
    if (!currentData || currentData.length === 0) {
        showOrderEmptyState('没有数据可以筛选');
        return;
    }
    
    // 如果是"全部"，显示所有数据
    if (status === 'all') {
        filteredData = [...currentData];
    } else {
        // 根据订单状态筛选
        filteredData = currentData.filter(order => {
            const orderStatus = order['订单状态'] || '';
            return matchOrderStatus(orderStatus, status);
        });
    }
    
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
    
    console.log(`状态筛选完成，找到 ${filteredData.length} 条记录`);
}

// 匹配订单状态
function matchOrderStatus(orderStatus, targetStatus) {
    // 使用新的状态映射关系
    const mappedStatuses = TAB_STATUS_MAPPING[targetStatus];
    if (mappedStatuses) {
        return mappedStatuses.includes(orderStatus);
    }
    
    // 如果没有映射关系，直接匹配
    return orderStatus === targetStatus;
}

// 更新订单状态 Tab 徽标数量
function updateOrderStatusTabBadges() {
    if (!currentData || currentData.length === 0) {
        return;
    }
    
    // 计算各状态的订单数量
    const statusCounts = {
        'all': currentData.length,
        '待审批': 0,
        '待确认': 0,
        '待发货': 0,
        '待集运收': 0,
        '待集运发': 0,
        '待企配收': 0,
        '待企配发': 0,
        '待妥投': 0,
        '待完成': 0,
        '已完成': 0
    };
    
    // 统计每个状态的订单数量
    currentData.forEach(order => {
        const orderStatus = order['订单状态'] || '';
        
        // 检查每个 Tab 状态
        Object.keys(statusCounts).forEach(status => {
            if (status !== 'all' && matchOrderStatus(orderStatus, status)) {
                statusCounts[status]++;
            }
        });
    });
    
    // 更新徽标显示
    Object.keys(statusCounts).forEach(status => {
        const badge = document.getElementById(`badge-${status}`);
        if (badge) {
            badge.textContent = statusCounts[status];
            // 如果数量为0，可以隐藏徽标或者用不同样式显示
            if (statusCounts[status] === 0) {
                badge.style.opacity = '0.5';
            } else {
                badge.style.opacity = '1';
            }
        }
    });
    
    console.log('订单状态徽标已更新:', statusCounts);
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

// 末端派送列表页面渲染
function renderDeliveryListPage() {
    // 隐藏默认搜索容器
    document.querySelector('.search-container').style.display = 'none';
    
    // 首先渲染页面结构
    renderDeliveryPageStructure();
    
    // 然后加载派送数据
    loadDeliveryData();
}

// 渲染末端派送页面结构
function renderDeliveryPageStructure() {
    const deliveryPageHTML = `
        <!-- 条件查询搜索框 -->
        <div class="order-search-container" style="font-size: 12px;">
            <div class="order-search-header">
                <span class="order-search-title">查询条件</span>
                <button class="order-expand-toggle" id="deliveryExpandToggle">收起</button>
            </div>
            <div class="order-form-content expanded" id="deliveryFormContent">
                <div class="order-search-form">
                    <!-- 第一行 -->
                    <div class="order-form-group">
                        <label>二段运单号</label>
                        <input type="text" id="secondSegmentNumber" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>订单编号</label>
                        <textarea id="deliveryOrderNumbers" placeholder="请输入订单编号，支持多个单号换行输入"></textarea>
                    </div>
                    <div class="order-form-group">
                        <label>二段运单状态</label>
                        <select id="secondSegmentStatus">
                            <option value="">请选择</option>
                            <option value="待发运">待发运</option>
                            <option value="已发运">已发运</option>
                            <option value="已妥投">已妥投</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>客户名称</label>
                        <select id="deliveryCustomerName" class="searchable-select">
                            <option value="">请选择或输入</option>
                            <!-- 客户选项将通过loadDeliveryCustomerOptions()函数动态加载 -->
                        </select>
                    </div>
                    
                    <!-- 第二行 -->
                    <div class="order-form-group">
                        <label>运输方式</label>
                        <select id="transportMethod">
                            <option value="">请选择</option>
                            <option value="快递运输">快递运输</option>
                            <option value="车辆运输">车辆运输</option>
                        </select>
                    </div>
                    <div class="order-form-group">
                        <label>承运单号</label>
                        <input type="text" id="carrierNumber" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>承运商</label>
                        <input type="text" id="carrierName" placeholder="请输入">
                    </div>
                    <div class="order-form-group">
                        <label>二段发运时间</label>
                        <div class="date-range-input">
                            <input type="date" id="secondSegmentShipStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="secondSegmentShipEnd" placeholder="请选择">
                        </div>
                    </div>
                    
                    <!-- 第三行 -->
                    <div class="order-form-group">
                        <label>二段运单妥投时间</label>
                        <div class="date-range-input">
                            <input type="date" id="secondSegmentDeliveryStart" placeholder="请选择">
                            <span class="separator">至</span>
                            <input type="date" id="secondSegmentDeliveryEnd" placeholder="请选择">
                        </div>
                    </div>
                    <div class="order-form-group">
                        <label>客户配送单号</label>
                        <input type="text" id="customerDeliveryNumber" placeholder="请输入">
                    </div>
                    <div class="order-form-group"></div> <!-- 占位符 -->
                    <div class="order-form-group"></div> <!-- 占位符 -->
                </div>
                <div class="order-actions">
                    <button class="btn-reset" onclick="resetDeliverySearchForm()">重置</button>
                    <button class="btn-search" onclick="searchDeliveryList()">查询</button>
                </div>
            </div>
        </div>

        <!-- 末端派送列表 -->
        <div class="order-table-container" style="font-size: 12px;">
            <div class="order-table-header">
                <div class="order-table-tools">
                    <div class="left-tools">
                        <button class="btn-export" onclick="exportReceiptForm()">导出签收单</button>
                    </div>
                    <div class="right-tools">
                        <button class="btn-columns" onclick="showDeliveryColumnSelector()">隐藏字段</button>
                    </div>
                </div>
            </div>
            <div class="order-table-wrapper">
                <table class="order-table">
                    <thead>
                        <tr>
                            <th class="fixed-column first" style="width: 120px; min-width: 120px;">二段运单号</th>
                            <th class="scrollable-column">二段运单状态</th>
                            <th class="scrollable-column">客户名称</th>
                            <th class="scrollable-column">运输方式</th>
                            <th class="scrollable-column">承运单号</th>
                            <th class="scrollable-column">承运商</th>
                            <th class="scrollable-column">配送人名字</th>
                            <th class="scrollable-column">车牌号</th>
                            <th class="scrollable-column">配送人电话</th>
                            <th class="scrollable-column">二段发运时间</th>
                            <th class="scrollable-column">二段运单妥投时间</th>
                            <th class="scrollable-column">签收单审批状态</th>
                            <th class="fixed-action" style="width: 120px; min-width: 120px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="deliveryTableBody">
                        <!-- 数据将通过loadDeliveryData()函数动态加载 -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 分页组件 -->
        <div class="pagination-container" style="font-size: 12px;">
            <div class="pagination-info">
                <span>共 <span id="deliveryTotalItems">${deliveryTotalItems}</span> 条</span>
            </div>
            <div class="pagination-controls">
                <div class="pagination-pages" id="deliveryPaginationPages">
                    ${renderDeliveryPaginationButtons()}
                </div>
                <div class="page-size-selector">
                    <select id="deliveryPageSizeSelect" onchange="changeDeliveryPageSize()">
                        <option value="10" ${deliveryPageSize === 10 ? 'selected' : ''}>10条/页</option>
                        <option value="20" ${deliveryPageSize === 20 ? 'selected' : ''}>20条/页</option>
                        <option value="50" ${deliveryPageSize === 50 ? 'selected' : ''}>50条/页</option>
                        <option value="100" ${deliveryPageSize === 100 ? 'selected' : ''}>100条/页</option>
                    </select>
                </div>
                <div class="page-jump">
                    <span>跳至</span>
                    <input type="number" id="deliveryJumpPageInput" min="1" max="${deliveryTotalPages}" value="${deliveryCurrentPage}">
                    <span>页</span>
                    <button onclick="jumpToDeliveryPage()">跳转</button>
                </div>
            </div>
        </div>

        <!-- 导出确认模态框 -->
        <div class="modal-overlay" id="deliveryExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">导出提示</span>
                    <button class="modal-close" onclick="closeModal('deliveryExportModal')">&times;</button>
                </div>
                <div class="modal-body">
                    已导出订单信息，请到任务中心查看
                </div>
                <div class="modal-footer">
                    <button class="btn-modal primary" onclick="closeModal('deliveryExportModal')">确认</button>
                </div>
            </div>
        </div>

        <!-- 隐藏字段选择模态框 -->
        <div class="modal-overlay" id="deliveryColumnSelectorModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <span class="modal-title">选择显示字段</span>
                    <button class="modal-close" onclick="closeModal('deliveryColumnSelectorModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="column-selector-container">
                        <div class="field-group">
                            <label><input type="checkbox" value="secondSegmentNumber" checked disabled> 二段运单号</label>
                            <label><input type="checkbox" value="secondSegmentStatus" checked> 二段运单状态</label>
                            <label><input type="checkbox" value="customerName" checked> 客户名称</label>
                            <label><input type="checkbox" value="transportMethod" checked> 运输方式</label>
                            <label><input type="checkbox" value="carrierNumber" checked> 承运单号</label>
                            <label><input type="checkbox" value="carrierName" checked> 承运商</label>
                        </div>
                        <div class="field-group">
                            <label><input type="checkbox" value="deliveryPersonName" checked> 配送人名字</label>
                            <label><input type="checkbox" value="plateNumber" checked> 车牌号</label>
                            <label><input type="checkbox" value="deliveryPersonPhone" checked> 配送人电话</label>
                            <label><input type="checkbox" value="secondSegmentShipTime" checked> 二段发运时间</label>
                            <label><input type="checkbox" value="secondSegmentDeliveryTime" checked> 二段运单妥投时间</label>
                            <label><input type="checkbox" value="receiptApprovalStatus" checked> 签收单审批状态</label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal secondary" onclick="selectAllDeliveryFields()">全选</button>
                    <button class="btn-modal secondary" onclick="clearAllDeliveryFields()">清空</button>
                    <button class="btn-modal secondary" onclick="closeModal('deliveryColumnSelectorModal')">取消</button>
                    <button class="btn-modal primary" onclick="confirmDeliveryColumns()">确认</button>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.innerHTML = deliveryPageHTML;
    
    // 初始化页面交互
    initializeDeliveryPage();
}

// 加载末端派送数据
async function loadDeliveryData() {
    try {
        // 模拟派送数据
        const deliveryData = [
            {
                secondSegmentNumber: 'WB20240701001',
                secondSegmentStatus: '待发运',
                customerName: '华为技术有限公司',
                transportMethod: '快递运输',
                carrierNumber: 'SF1234567890',
                carrierName: '顺丰速运',
                deliveryPersonName: '张三',
                plateNumber: '京A12345',
                deliveryPersonPhone: '13800138000',
                secondSegmentShipTime: '-',
                secondSegmentDeliveryTime: '-',
                receiptApprovalStatus: '-'
            },
            {
                secondSegmentNumber: 'WB20240701002',
                secondSegmentStatus: '已发运',
                customerName: '小米科技有限公司',
                transportMethod: '车辆运输',
                carrierNumber: 'YTO9876543210',
                carrierName: '圆通速递',
                deliveryPersonName: '李四',
                plateNumber: '沪B67890',
                deliveryPersonPhone: '13900139000',
                secondSegmentShipTime: '2024-07-01 14:30',
                secondSegmentDeliveryTime: '-',
                receiptApprovalStatus: '-'
            },
            {
                secondSegmentNumber: 'WB20240701003',
                secondSegmentStatus: '已发运',
                customerName: 'OPPO广东移动通信有限公司',
                transportMethod: '快递运输',
                carrierNumber: 'ZTO5432109876',
                carrierName: '中通快递',
                deliveryPersonName: '王五',
                plateNumber: '粤C54321',
                deliveryPersonPhone: '13700137000',
                secondSegmentShipTime: '2024-07-02 09:15',
                secondSegmentDeliveryTime: '-',
                receiptApprovalStatus: '未通过'
            },
            {
                secondSegmentNumber: 'WB20240701004',
                secondSegmentStatus: '已妥投',
                customerName: 'vivo移动通信有限公司',
                transportMethod: '快递运输',
                carrierNumber: 'EMS1357924680',
                carrierName: '中国邮政',
                deliveryPersonName: '赵六',
                plateNumber: '苏D98765',
                deliveryPersonPhone: '13600136000',
                secondSegmentShipTime: '2024-06-30 16:45',
                secondSegmentDeliveryTime: '2024-07-03 10:20',
                receiptApprovalStatus: '已通过'
            }
        ];
        
        deliveryFullData = deliveryData;
        renderDeliveryTable(deliveryData);
    } catch (error) {
        console.log('加载末端派送数据时出错:', error);
        showDeliveryEmptyState('加载数据失败');
    }
}

// 渲染末端派送表格
function renderDeliveryTable(data) {
    if (!data || data.length === 0) {
        showDeliveryEmptyState('暂无数据');
        return;
    }

    // 设置分页信息
    deliveryTotalItems = data.length;
    deliveryTotalPages = Math.ceil(deliveryTotalItems / deliveryPageSize);
    if (deliveryCurrentPage > deliveryTotalPages) {
        deliveryCurrentPage = 1;
    }

    // 获取当前页数据
    const startIndex = (deliveryCurrentPage - 1) * deliveryPageSize;
    const endIndex = startIndex + deliveryPageSize;
    deliveryPageData = data.slice(startIndex, endIndex);

    // 渲染表格数据
    const tableBody = document.getElementById('deliveryTableBody');
    if (tableBody) {
        tableBody.innerHTML = deliveryPageData.map(row => `
            <tr>
                <td class="fixed-column first" style="width: 120px; min-width: 120px;">${row.secondSegmentNumber}</td>
                <td>${row.secondSegmentStatus}</td>
                <td>${row.customerName}</td>
                <td>${row.transportMethod}</td>
                <td>${row.carrierNumber}</td>
                <td>${row.carrierName}</td>
                <td>${row.deliveryPersonName}</td>
                <td>${row.plateNumber}</td>
                <td>${row.deliveryPersonPhone}</td>
                <td>${row.secondSegmentShipTime}</td>
                <td>${row.secondSegmentDeliveryTime}</td>
                <td>${row.receiptApprovalStatus}</td>
                <td class="fixed-action" style="width: 200px; min-width: 200px;">
                    ${getDeliveryActionButtons(row)}
                </td>
            </tr>
        `).join('');
    }

    // 更新分页信息
    updateDeliveryPagination();
}

// 获取末端派送操作按钮
function getDeliveryActionButtons(row) {
    const status = row.secondSegmentStatus;
    let buttons = [];

    if (status === '待发运') {
        buttons.push(`<a href="#" class="action-link" onclick="shipDelivery('${row.secondSegmentNumber}')">发运</a>`);
    } else if (status === '已发运') {
        buttons.push(`<a href="#" class="action-link" onclick="deliverOrder('${row.secondSegmentNumber}')">妥投</a>`);
        if (row.receiptApprovalStatus === '未通过') {
            buttons.pop();
            buttons.push(`<a href="#" class="action-link" onclick="uploadReceiptForm('${row.secondSegmentNumber}')">上传签收单</a>`);
        }
    }

    // 通用按钮
    buttons.push(`<a href="#" class="action-link" onclick="downloadHandoverForm('${row.secondSegmentNumber}')">下载交接单</a>`);
    buttons.push(`<a href="#" class="action-link" onclick="viewDeliveryDetail('${row.secondSegmentNumber}')">详情</a>`);

    return buttons.join(' ');
}

// 渲染末端派送分页按钮
function renderDeliveryPaginationButtons() {
    let pagesHTML = '';
    
    // 计算显示的页码范围
    const maxVisiblePages = 7;
    let startPage = Math.max(1, deliveryCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(deliveryTotalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 上一页按钮
    if (deliveryCurrentPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToDeliveryPage(${deliveryCurrentPage - 1})">上一页</button>`;
    }
    
    // 第一页
    if (startPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToDeliveryPage(1)">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === deliveryCurrentPage ? ' active' : '';
        pagesHTML += `<button class="page-btn${activeClass}" onclick="goToDeliveryPage(${i})">${i}</button>`;
    }
    
    // 最后一页
    if (endPage < deliveryTotalPages) {
        if (endPage < deliveryTotalPages - 1) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
        pagesHTML += `<button class="page-btn" onclick="goToDeliveryPage(${deliveryTotalPages})">${deliveryTotalPages}</button>`;
    }
    
    // 下一页按钮
    if (deliveryCurrentPage < deliveryTotalPages) {
        pagesHTML += `<button class="page-btn" onclick="goToDeliveryPage(${deliveryCurrentPage + 1})">下一页</button>`;
    }
    
    return pagesHTML;
}

// 更新末端派送分页
function updateDeliveryPagination() {
    // 更新总数显示
    const totalItemsSpan = document.getElementById('deliveryTotalItems');
    if (totalItemsSpan) {
        totalItemsSpan.textContent = deliveryTotalItems;
    }

    // 更新分页按钮
    const paginationPages = document.getElementById('deliveryPaginationPages');
    if (paginationPages) {
        paginationPages.innerHTML = renderDeliveryPaginationButtons();
    }

    // 更新跳转输入框
    const jumpPageInput = document.getElementById('deliveryJumpPageInput');
    if (jumpPageInput) {
        jumpPageInput.max = deliveryTotalPages;
        jumpPageInput.value = deliveryCurrentPage;
    }
}

// 显示末端派送空状态
function showDeliveryEmptyState(message = '暂无数据') {
    const tableBody = document.getElementById('deliveryTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="13" class="empty-state-cell" style="text-align: center; padding: 20px;">
                    <div class="empty-state">
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// 初始化末端派送页面交互
function initializeDeliveryPage() {
    // 展开/收起搜索条件
    const expandToggle = document.getElementById('deliveryExpandToggle');
    const formContent = document.getElementById('deliveryFormContent');
    
    if (expandToggle && formContent) {
        expandToggle.addEventListener('click', function() {
            const isExpanded = formContent.classList.contains('expanded');
            formContent.classList.toggle('expanded', !isExpanded);
            this.textContent = isExpanded ? '展开' : '收起';
        });
    }
    
    // 加载客户选项
    loadDeliveryCustomerOptions();
}

// 显示末端派送字段选择器
function showDeliveryColumnSelector() {
    const modal = document.getElementById('deliveryColumnSelectorModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 全选末端派送字段
function selectAllDeliveryFields() {
    const checkboxes = document.querySelectorAll('#deliveryColumnSelectorModal input[type="checkbox"]:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

// 清空末端派送字段选择
function clearAllDeliveryFields() {
    const checkboxes = document.querySelectorAll('#deliveryColumnSelectorModal input[type="checkbox"]:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 确认末端派送字段显示
function confirmDeliveryColumns() {
    const selectedFields = [];
    const checkboxes = document.querySelectorAll('#deliveryColumnSelectorModal input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedFields.push(checkbox.value);
    });
    
    console.log('选择的字段:', selectedFields);
    // 这里可以添加隐藏/显示列的逻辑
    
    closeModal('deliveryColumnSelectorModal');
}

// 加载末端派送页面的客户选项
async function loadDeliveryCustomerOptions() {
    const customerSelect = document.getElementById('deliveryCustomerName');
    if (!customerSelect) return;
    
    // 模拟客户数据
    const customers = [
        '华为技术有限公司',
        '小米科技有限公司',
        'OPPO广东移动通信有限公司',
        'vivo移动通信有限公司',
        '联想集团有限公司',
        '海尔集团公司',
        '美的集团股份有限公司',
        '格力电器股份有限公司'
    ];
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer;
        option.textContent = customer;
        customerSelect.appendChild(option);
    });
}

// 重置末端派送搜索表单
function resetDeliverySearchForm() {
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
}

// 查询末端派送列表
function searchDeliveryList() {
    console.log('执行末端派送列表查询...');
    // 这里可以添加具体的查询逻辑
}

// 导出签收单
function exportReceiptForm() {
    const modal = document.getElementById('deliveryExportModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 发运操作
function shipDelivery(trackingNumber) {
    console.log('发运操作:', trackingNumber);
    // 这里可以添加发运的具体逻辑
}

// 妥投操作
function deliverOrder(trackingNumber) {
    console.log('妥投操作:', trackingNumber);
    // 这里可以添加妥投的具体逻辑
}

// 上传签收单
function uploadReceiptForm(trackingNumber) {
    console.log('上传签收单:', trackingNumber);
    // 这里可以添加上传签收单的具体逻辑
}

// 下载交接单
function downloadHandoverForm(trackingNumber) {
    console.log('下载交接单:', trackingNumber);
    // 这里可以添加下载交接单的具体逻辑
}

// 查看末端派送详情
function viewDeliveryDetail(trackingNumber) {
    console.log('查看详情:', trackingNumber);
    // 这里可以添加查看详情的具体逻辑
}

// 跳转到指定页面（末端派送）
function goToDeliveryPage(page) {
    if (page < 1 || page > deliveryTotalPages) return;
    
    deliveryCurrentPage = page;
    renderDeliveryTable(deliveryFullData);
}

// 改变每页显示数量（末端派送）
function changeDeliveryPageSize() {
    const pageSizeSelect = document.getElementById('deliveryPageSizeSelect');
    if (pageSizeSelect) {
        deliveryPageSize = parseInt(pageSizeSelect.value);
        deliveryCurrentPage = 1; // 重置到第一页
        renderDeliveryTable(deliveryFullData);
    }
}

// 跳转到指定页面（末端派送）
function jumpToDeliveryPage() {
    const jumpPageInput = document.getElementById('deliveryJumpPageInput');
    if (jumpPageInput) {
        const page = parseInt(jumpPageInput.value);
        if (page >= 1 && page <= deliveryTotalPages) {
            goToDeliveryPage(page);
        }
    }
}

// 显示订单列表禁用消息
function showDisabledOrderListMessage() {
    // 隐藏默认搜索容器
    document.querySelector('.search-container').style.display = 'none';
    
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = `
        <div class="disabled-page-message">
            <div class="disabled-icon">🚫</div>
            <h3>订单列表功能已禁用</h3>
            <p>原订单列表功能已被拆分为各国家订单列表，请从左侧菜单选择对应国家的订单列表：</p>
            <ul class="country-list">
                <li><a href="#" onclick="navigateToPage('泰国订单列表')">泰国订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('越南订单列表')">越南订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('马来订单列表')">马来订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('印度尼西亚订单列表')">印度尼西亚订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('巴西订单列表')">巴西订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('匈牙利订单列表')">匈牙利订单列表</a></li>
                <li><a href="#" onclick="navigateToPage('香港订单列表')">香港订单列表</a></li>
            </ul>
        </div>
    `;
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// ===== 国家订单列表相关函数 =====

// 加载指定国家的订单数据
async function loadCountryOrderData(country) {
    try {
        showOrderLoading();
        
        const response = await fetch('./data/订单.csv');
        if (response.ok) {
            const csvText = await response.text();
            const allOrderData = parseCSV(csvText);
            
            // 根据国家过滤数据
            const countryFilteredData = allOrderData.filter(order => {
                return matchOrderCountry(order, country);
            }).slice(0, 10); // 限制每个国家显示10条数据
            
            // 使用原订单列表的全局变量
            orderFullData = countryFilteredData;
            currentData = countryFilteredData;
            filteredData = [...countryFilteredData];
            orderTotalItems = countryFilteredData.length;
            orderTotalPages = Math.ceil(countryFilteredData.length / orderPageSize);
            orderCurrentPage = 1;
            
            // 确保订单状态下拉框显示所有选项（默认为"全部"Tab）
            updateOrderStatusDropdown('all');
            
            // 渲染表格
            renderOrderTable(countryFilteredData);
            
            // 更新订单状态 Tab 徽标
            updateOrderStatusTabBadges();
            
            console.log(`加载${country}订单数据成功，共${countryFilteredData.length}条记录`);
        } else {
            showOrderEmptyState(`${country}订单数据文件未找到`);
        }
    } catch (error) {
        console.error(`加载${country}订单数据失败:`, error);
        showOrderEmptyState(`加载${country}订单数据失败`);
    }
}

// 判断订单是否属于指定国家
function matchOrderCountry(order, targetCountry) {
    // 国家识别规则
    const countryRules = {
        '泰国': {
            currencies: ['THB'],
            customerKeywords: ['泰国', 'Thailand', 'THAILAND', 'Thai'],
            warehouseKeywords: ['泰国'],
            companyKeywords: ['Thailand', 'Multi-Fineline Electronic (Thailand)', 'Yunlu Ems Tec(Thailand)', 'SUNWODA AUTOMOTIVE ENERGY TECHNOLOGY (THAILAND)']
        },
        '越南': {
            currencies: ['VND'],
            customerKeywords: ['越南', 'Vietnam', 'VIETNAM', '(越南)', 'Việt Nam', 'VIET NAM'],
            warehouseKeywords: ['越南'],
            companyKeywords: ['Vietnam', 'VIETNAM', '越南', 'BYD Electronics (Vietnam)', 'CÔNG TY TNHH', 'BOVIET HAI DUONG', 'AAC TECHNOLOGIES VIỆT NAM']
        },
        '马来西亚': {
            currencies: ['MYR'],
            customerKeywords: ['马来西亚', 'Malaysia', 'MALAYSIA', '大马'],
            warehouseKeywords: ['马来西亚'],
            companyKeywords: ['Malaysia', 'MALAYSIA', 'SDN. BHD', 'SDN BHD', 'COSMX TECHNOLOGY MALAYSIA', 'EVE ENERGY MALAYSIA']
        },
        '印度尼西亚': {
            currencies: ['IDR'],
            customerKeywords: ['印度尼西亚', 'Indonesia', 'INDONESIA', '印尼'],
            warehouseKeywords: ['印尼'],
            companyKeywords: ['Indonesia', 'INDONESIA', 'PT ', 'PT BYD AUTO INDONESIA', 'PT Contemporary Amperex Technology Indonesia']
        },
        '巴西': {
            currencies: ['BRL'],
            customerKeywords: ['巴西', 'Brazil', 'BRAZIL', '巴伊亚', '圣保罗'],
            warehouseKeywords: ['巴西'],
            companyKeywords: ['Brazil', 'BRAZIL', '巴西', '比亚迪汽车巴西有限公司']
        },
        '匈牙利': {
            currencies: ['EUR'],
            customerKeywords: ['匈牙利', 'Hungary', 'HUNGARY', 'Kft', '布达佩斯'],
            warehouseKeywords: ['匈牙利'],
            companyKeywords: ['Hungary', 'HUNGARY', 'Kft', 'BYD Electric Bus and Truck Hungary']
        },
        '香港': {
            currencies: ['HKD'],
            customerKeywords: ['香港', 'Hong Kong', 'HK', '金门'],
            warehouseKeywords: ['香港'],
            companyKeywords: ['Hong Kong', '香港', '金门项目']
        }
    };

    const rules = countryRules[targetCountry];
    if (!rules) return false;

    const customerName = order['客户名称'] || '';
    const currency = order['币种'] || '';
    const warehouseName = order['备货仓名称'] || '';
    
    // 检查币种匹配
    if (rules.currencies && rules.currencies.includes(currency)) {
        return true;
    }
    
    // 检查客户名称关键词
    if (rules.customerKeywords) {
        for (let keyword of rules.customerKeywords) {
            if (customerName.includes(keyword)) {
                return true;
            }
        }
    }
    
    // 检查公司名称关键词
    if (rules.companyKeywords) {
        for (let keyword of rules.companyKeywords) {
            if (customerName.includes(keyword)) {
                return true;
            }
        }
    }
    
    // 检查仓库名称关键词
    if (rules.warehouseKeywords) {
        for (let keyword of rules.warehouseKeywords) {
            if (warehouseName.includes(keyword)) {
                return true;
            }
        }
    }
    
    return false;
}

// 渲染指定国家的订单表格
function renderCountryOrderTable(country, data) {
    if (!data || data.length === 0) {
        showCountryOrderEmptyState(`暂无${country}订单数据`);
        return;
    }

    // 获取当前页数据
    const countryData = countryOrderData[country];
    const startIndex = (countryData.currentPage - 1) * countryData.pageSize;
    const endIndex = startIndex + countryData.pageSize;
    countryData.pageData = data.slice(startIndex, endIndex);

    // 渲染表格数据
    const tableBody = document.getElementById('countryOrderTableBody');
    if (tableBody) {
        const tableHTML = countryData.pageData.map(order => `
            <tr>
                <td class="fixed-column checkbox-column">
                    <input type="checkbox" class="country-row-checkbox" value="${order['订单编号'] || ''}" onchange="updateCountrySelectAllState('${country}')">
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
    }

    // 更新分页信息
    updateCountryOrderPagination(country);
}

// 显示国家订单加载状态
function showCountryOrderLoading() {
    const tableBody = document.getElementById('countryOrderTableBody');
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

// 显示国家订单空状态
function showCountryOrderEmptyState(message = '暂无订单数据') {
    const tableBody = document.getElementById('countryOrderTableBody');
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

// 更新国家订单分页
function updateCountryOrderPagination(country) {
    const countryData = countryOrderData[country];
    
    // 更新总数显示
    const totalItemsElement = document.getElementById('countryOrderTotalItems');
    if (totalItemsElement) {
        totalItemsElement.textContent = countryData.totalItems;
    }

    // 更新分页按钮
    const paginationPages = document.getElementById('countryOrderPaginationPages');
    if (paginationPages) {
        paginationPages.innerHTML = renderCountryOrderPaginationButtons(country);
    }

    // 更新跳转输入框
    const jumpPageInput = document.getElementById('countryOrderJumpPageInput');
    if (jumpPageInput) {
        jumpPageInput.max = countryData.totalPages;
        jumpPageInput.value = countryData.currentPage;
    }
}

// 渲染国家订单分页按钮
function renderCountryOrderPaginationButtons(country) {
    const countryData = countryOrderData[country];
    let pagesHTML = '';
    
    // 计算显示的页码范围
    const maxVisiblePages = 7;
    let startPage = Math.max(1, countryData.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(countryData.totalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 上一页按钮
    if (countryData.currentPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToCountryOrderPage('${country}', ${countryData.currentPage - 1})">上一页</button>`;
    }
    
    // 第一页
    if (startPage > 1) {
        pagesHTML += `<button class="page-btn" onclick="goToCountryOrderPage('${country}', 1)">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === countryData.currentPage ? ' active' : '';
        pagesHTML += `<button class="page-btn${activeClass}" onclick="goToCountryOrderPage('${country}', ${i})">${i}</button>`;
    }
    
    // 最后一页
    if (endPage < countryData.totalPages) {
        if (endPage < countryData.totalPages - 1) {
            pagesHTML += `<span class="page-ellipsis">…</span>`;
        }
        pagesHTML += `<button class="page-btn" onclick="goToCountryOrderPage('${country}', ${countryData.totalPages})">${countryData.totalPages}</button>`;
    }
    
    // 下一页按钮
    if (countryData.currentPage < countryData.totalPages) {
        pagesHTML += `<button class="page-btn" onclick="goToCountryOrderPage('${country}', ${countryData.currentPage + 1})">下一页</button>`;
    }
    
    return pagesHTML;
}

// 初始化国家订单页面交互
function initializeCountryOrderPage(country) {
    const expandToggle = document.getElementById('countryOrderExpandToggle');
    const formContent = document.getElementById('countryOrderFormContent');
    
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
    loadCountryOrderCustomerOptions(country);
}

// 加载国家订单页面的客户选项
async function loadCountryOrderCustomerOptions(country) {
    try {
        const customerData = await loadCustomerConfigData();
        const customerSelect = document.getElementById('countryCustomerName');
        
        if (!customerSelect) return;
        
        if (customerData.length > 0) {
            // 清空现有选项
            customerSelect.innerHTML = '<option value="">请选择或输入</option>';
            
            // 根据国家过滤客户，然后去重
            const countryCustomers = customerData
                .filter(customer => {
                    const customerCountry = customer.country || '';
                    // 这里可以根据实际的国家代码映射进行匹配
                    return customerCountry.includes(country) || 
                           (country === '泰国' && customerCountry === 'TH') ||
                           (country === '越南' && customerCountry === 'VN') ||
                           (country === '马来西亚' && customerCountry === 'MY') ||
                           (country === '印度尼西亚' && customerCountry === 'ID') ||
                           (country === '巴西' && customerCountry === 'BR') ||
                           (country === '匈牙利' && customerCountry === 'HU') ||
                           (country === '香港' && customerCountry === 'HK');
                })
                .map(customer => customer.clientName)
                .filter(name => name && name.trim());
            
            const uniqueCustomers = [...new Set(countryCustomers)];
            
            // 添加客户选项
            uniqueCustomers.forEach(customerName => {
                const option = document.createElement('option');
                option.value = customerName;
                option.textContent = customerName;
                customerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error(`加载${country}客户选项失败:`, error);
    }
}

// 国家订单相关操作函数
function goToCountryOrderPage(country, page) {
    const countryData = countryOrderData[country];
    if (page < 1 || page > countryData.totalPages) return;
    
    countryData.currentPage = page;
    renderCountryOrderTable(country, countryData.fullData);
}

function changeCountryOrderPageSize(country) {
    const pageSizeSelect = document.getElementById('countryOrderPageSizeSelect');
    if (pageSizeSelect) {
        countryOrderData[country].pageSize = parseInt(pageSizeSelect.value);
        countryOrderData[country].currentPage = 1; // 重置到第一页
        countryOrderData[country].totalPages = Math.ceil(countryOrderData[country].totalItems / countryOrderData[country].pageSize);
        renderCountryOrderTable(country, countryOrderData[country].fullData);
    }
}

function jumpToCountryOrderPage(country) {
    const jumpPageInput = document.getElementById('countryOrderJumpPageInput');
    if (jumpPageInput) {
        const page = parseInt(jumpPageInput.value);
        const countryData = countryOrderData[country];
        if (page >= 1 && page <= countryData.totalPages) {
            goToCountryOrderPage(country, page);
        }
    }
}

function toggleCountrySelectAll(selectAllCheckbox, country) {
    const rowCheckboxes = document.querySelectorAll('.country-row-checkbox');
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    updateCountryBatchButtonState(country);
}

function updateCountrySelectAllState(country) {
    const selectAllCheckbox = document.getElementById('countrySelectAll');
    const rowCheckboxes = document.querySelectorAll('.country-row-checkbox');
    const checkedCount = document.querySelectorAll('.country-row-checkbox:checked').length;
    
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
    
    updateCountryBatchButtonState(country);
}

function updateCountryBatchButtonState(country) {
    const checkedCount = document.querySelectorAll('.country-row-checkbox:checked').length;
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

function resetCountryOrderSearchForm(country) {
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
    
    // 重置到显示该国家的所有订单
    if (countryOrderData[country].fullData && countryOrderData[country].fullData.length > 0) {
        countryOrderData[country].currentPage = 1;
        renderCountryOrderTable(country, countryOrderData[country].fullData);
    }
}

function searchCountryOrders(country) {
    console.log(`执行${country}订单查询...`);
    
    if (!countryOrderData[country].fullData || countryOrderData[country].fullData.length === 0) {
        showCountryOrderEmptyState(`没有${country}订单数据可以查询`);
        return;
    }
    
    // 获取搜索条件
    const searchConditions = {
        orderNumbers: document.getElementById('countryOrderNumbers')?.value.trim(),
        parentOrderNumbers: document.getElementById('countryParentOrderNumbers')?.value.trim(),
        thirdPartyOrderNumbers: document.getElementById('countryThirdPartyOrderNumbers')?.value.trim(),
        orderType: document.getElementById('countryOrderType')?.value,
        orderStatus: document.getElementById('countryOrderStatus')?.value,
        customerName: document.getElementById('countryCustomerName')?.value,
        customerPO: document.getElementById('countryCustomerPO')?.value.trim(),
        orderDateStart: document.getElementById('countryOrderDateStart')?.value,
        orderDateEnd: document.getElementById('countryOrderDateEnd')?.value
    };
    
    // 过滤数据
    const filteredData = countryOrderData[country].fullData.filter(order => {
        // 订单编号筛选
        if (searchConditions.orderNumbers) {
            const orderNums = searchConditions.orderNumbers.split('\n').map(s => s.trim()).filter(s => s);
            const matches = orderNums.some(num => (order['订单编号'] || '').includes(num));
            if (!matches) return false;
        }
        
        // 其他条件筛选
        if (searchConditions.orderType && order['业务模式'] !== searchConditions.orderType) return false;
        if (searchConditions.orderStatus && order['订单状态'] !== searchConditions.orderStatus) return false;
        if (searchConditions.customerName && !(order['客户名称'] || '').includes(searchConditions.customerName)) return false;
        if (searchConditions.customerPO && !(order['客户PO号'] || '').includes(searchConditions.customerPO)) return false;
        
        return true;
    });
    
    // 更新分页信息
    countryOrderData[country].totalItems = filteredData.length;
    countryOrderData[country].totalPages = Math.ceil(filteredData.length / countryOrderData[country].pageSize);
    countryOrderData[country].currentPage = 1;
    
    // 渲染过滤后的数据
    renderCountryOrderTable(country, filteredData);
    
    console.log(`${country}订单查询完成，找到 ${filteredData.length} 条记录`);
}

function batchCountryDelivery(country) {
    const selectedOrders = getSelectedCountryOrders();
    
    if (selectedOrders.length === 0) {
        alert('请先选择要合单派送的订单');
        return;
    }
    
    if (selectedOrders.length === 1) {
        alert('合单派送需要选择至少2个订单');
        return;
    }
    
    const confirmMessage = `确定要对以下 ${selectedOrders.length} 个${country}订单进行合单派送吗？\n\n订单编号：\n${selectedOrders.join('\n')}`;
    
    if (confirm(confirmMessage)) {
        console.log(`执行${country}订单合单派送:`, selectedOrders);
        alert(`已成功提交 ${selectedOrders.length} 个${country}订单的合单派送请求`);
        
        // 清除选择状态
        const selectAllCheckbox = document.getElementById('countrySelectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        document.querySelectorAll('.country-row-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateCountryBatchButtonState(country);
    }
}

function getSelectedCountryOrders() {
    const checkedBoxes = document.querySelectorAll('.country-row-checkbox:checked');
    return Array.from(checkedBoxes).map(checkbox => checkbox.value);
}

function exportCountryOrders(country) {
    const modal = document.getElementById('countryOrderExportModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// ===== 通用工具函数 =====

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// 显示错误消息
function showErrorMessage(message) {
    console.error(message);
    alert(message);
}

// 显示成功消息
function showSuccessMessage(message) {
    console.log(message);
    alert(message);
}
