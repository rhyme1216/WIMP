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
    
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
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
                ${data.map(row => `
                    <tr>
                        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
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
                        <label>客户名称</label>
                        <select id="customerName" style="width: 100%;">
                            <option value="">请选择或输入</option>
                            <option value="华为技术有限公司">华为技术有限公司</option>
                            <option value="小米科技有限责任公司">小米科技有限责任公司</option>
                            <option value="OPPO广东移动通信有限公司">OPPO广东移动通信有限公司</option>
                            <option value="vivo通信科技有限公司">vivo通信科技有限公司</option>
                            <option value="联想集团有限公司">联想集团有限公司</option>
                            <option value="TCL科技集团股份有限公司">TCL科技集团股份有限公司</option>
                            <option value="海尔智家股份有限公司">海尔智家股份有限公司</option>
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
                        <th class="scrollable-column">客户名称</th>
                        <th class="scrollable-column">下单时间</th>
                        <th class="scrollable-column">承诺发货时间</th>
                        <th class="scrollable-column">承诺送达时间</th>
                        <th class="scrollable-column">异常环节</th>
                        <th class="scrollable-column">异常类型</th>
                        <th class="scrollable-column">异常状态</th>
                        <th class="scrollable-column">异常开始时间</th>
                        <th class="scrollable-column">异常关闭时间</th>
                        <th class="scrollable-column">WOMS单号</th>
                        <th class="fixed-column last">操作</th>
                    </tr>
                </thead>
                <tbody id="exceptionTableBody">
                    <!-- 示例数据 -->
                    <tr>
                        <td class="fixed-column first">ORD20240701001</td>
                        <td>跨境直发</td>
                        <td>泰国</td>
                        <td>华为技术有限公司</td>
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
                        <td>小米科技有限责任公司</td>
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
                        <td>OPPO广东移动通信有限公司</td>
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

// 初始化异常列表页面交互
function initializeExceptionPage() {
    const expandToggle = document.getElementById('expandToggle');
    const formContent = document.getElementById('formContent');
    
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
    
    // 初始化分页
    initExceptionPagination();
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

// 分页相关函数
function initExceptionPagination() {
    // 模拟异常数据
    const mockExceptionData = [];
    for (let i = 1; i <= 156; i++) {
        mockExceptionData.push({
            orderNo: `ORD2024070${String(i).padStart(4, '0')}`,
            orderType: ['跨境直发', '本本直发', '备货仓发', '备货入库'][i % 4],
            country: ['泰国', '越南', '马来西亚', '印尼', '巴西', '匈牙利'][i % 6],
            customer: ['华为技术有限公司', '小米科技有限责任公司', 'OPPO广东移动通信有限公司'][i % 3],
            orderTime: `2024-07-${String(Math.floor(i/5) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            promiseShipTime: `2024-07-${String(Math.floor(i/5) + 3).padStart(2, '0')} 18:00`,
            promiseDeliveryTime: `2024-07-${String(Math.floor(i/5) + 8).padStart(2, '0')} 18:00`,
            exceptionStage: ['运输环节', '清关环节', '仓储环节', '配送环节'][i % 4],
            exceptionType: ['物流延误', '清关异常', '库存不足', '地址错误'][i % 4],
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
