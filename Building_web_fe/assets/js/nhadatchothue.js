// ===================================================
// FILE: tkbds.js
// CHỨC NĂNG: Quản lý UI tìm kiếm (Modal, Offcanvas, jQuery)
// YÊU CẦU: Phải được tải SAU dsbds.js (vì nó gọi hàm loadBds())
// ===================================================

// =========================================================
// 1. CÁC HẰNG SỐ VÀ BIẾN GLOBAL (ở ĐẦU file tkbds.js)
// =========================================================
const MAX_PRICE_VALUE = 50000; // 50 tỷ tính theo đơn vị triệu VND
const MAX_AREA_VALUE = 1000; // 1000 m2
const DEFAULT_PRICE_LABEL = "Tất cả mức giá";
const DEFAULT_AREA_LABEL = "Tất cả diện tích";
const ONE_MILLION = 1000000; // Hằng số cho 1 triệu

// Đối tượng lưu trữ trạng thái bộ lọc hiện tại
let globalFilters = {
    searchTerm: "",
    trangThai: "cho_thue",
    loaiBds: "",
    minPrice: 0,
    maxPrice: MAX_PRICE_VALUE,
    labelPrice: DEFAULT_PRICE_LABEL,
    minArea: 0,
    maxArea: MAX_AREA_VALUE,
    labelArea: DEFAULT_AREA_LABEL,
    viTri: ""
};

// =========================================================
// 2. CÁC HÀM TIỆN ÍCH
// =========================================================

// --- Hàm format giá và diện tích để hiển thị ---
function formatValueForDisplay(value, type, maxValue) {
    if (value === 0) return '0';
    if (value === maxValue) return 'trở lên'; // Cho giá trị max của khoảng
    if (type === 'price') {
        if (value >= 1000) return (value / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' tỷ';
        return value.toLocaleString('vi-VN') + ' triệu';
    }
    return value.toLocaleString('vi-VN') + ' m²';
}

/**
 * Hàm để tạo label hiển thị cho Khoảng giá/Diện tích dựa trên min/max
 * @param {number} min - Giá trị tối thiểu
 * @param {number|string} max - Giá trị tối đa hoặc 'max' (có thể là chuỗi 'max' hoặc số)
 * @param {string} type - 'price' hoặc 'area'
 * @returns {string} Label hiển thị
 */
function createRangeLabel(min, max, type) {
    const defaultLabel = type === 'price' ? DEFAULT_PRICE_LABEL : DEFAULT_AREA_LABEL;
    const maxValue = type === 'price' ? MAX_PRICE_VALUE : MAX_AREA_VALUE;
    const formatFn = (val) => formatValueForDisplay(val, type, maxValue);

    // Đảm bảo max là số
    const actualMax = (max === 'max' || max === 'custom') ? maxValue : max;

    if (min === 0 && actualMax === maxValue) {
        return defaultLabel;
    } else if (min === 0) {
        return `Dưới ${formatFn(actualMax)}`;
    } else if (actualMax === maxValue) {
        return `Từ ${formatFn(min)}`;
    } else {
        return `${formatFn(min)} - ${formatFn(actualMax)}`;
    }
}

// --- Hàm cập nhật badge số lượng bộ lọc ---
function updateFilterCountBadge() {
    let count = 0;
    if (globalFilters.searchTerm && globalFilters.searchTerm.trim() !== "") count++;
    if (globalFilters.trangThai && globalFilters.trangThai !== "") count++;
    if (globalFilters.loaiBds && globalFilters.loaiBds !== 'all' && globalFilters.loaiBds !== "") count++;
    if (globalFilters.viTri && globalFilters.viTri.trim() !== "") count++;
    if (globalFilters.minPrice !== 0 || globalFilters.maxPrice !== MAX_PRICE_VALUE) count++;
    if (globalFilters.minArea !== 0 || globalFilters.maxArea !== MAX_AREA_VALUE) count++;

    $('#filterCountBadge').text(count);
    $('#filterCountBadge').toggle(count > 0); // Hiện/ẩn badge
}

/**
 * Hàm "ĐIỀU PHỐI" tìm kiếm chính
 * Cập nhật globalFilters và gọi API với các bộ lọc đã chuẩn hóa
 * @param {object} newFilters - Đối tượng JSON chứa các bộ lọc mới cần áp dụng
 */
function filterAndDisplayResults(newFilters = {}) {
    // Cập nhật globalFilters với các giá trị mới
    globalFilters = { ...globalFilters, ...newFilters };

    // --- Bắt đầu xây dựng đối tượng filtersForApi ---
    const filtersForApi = {};

    // Xử lý searchTerm
    if (globalFilters.searchTerm && globalFilters.searchTerm.trim() !== "") {
        filtersForApi.searchTerm = globalFilters.searchTerm.trim();
    }

    // Xử lý trangThai
    if (globalFilters.trangThai && globalFilters.trangThai !== "") {
        filtersForApi.trangThai = String(globalFilters.trangThai).toLowerCase();
    }

    // Xử lý loaiBds
    if (globalFilters.loaiBds && globalFilters.loaiBds !== "" && globalFilters.loaiBds !== "all") {
        filtersForApi.loaiBds = String(globalFilters.loaiBds).toLowerCase();
    }

    // Xử lý viTri
    if (globalFilters.viTri && globalFilters.viTri.trim() !== "") {
        filtersForApi.viTri = globalFilters.viTri.trim();
    }

    // Xử lý giá (chỉ thêm vào nếu không phải giá trị mặc định, và nhân lên 1 triệu)
    if (globalFilters.minPrice !== 0 || globalFilters.maxPrice !== MAX_PRICE_VALUE) {
        filtersForApi.minPrice = globalFilters.minPrice * ONE_MILLION;
        filtersForApi.maxPrice = globalFilters.maxPrice * ONE_MILLION;
    }

    // Xử lý diện tích (chỉ thêm vào nếu không phải giá trị mặc định)
    if (globalFilters.minArea !== 0 || globalFilters.maxArea !== MAX_AREA_VALUE) {
        filtersForApi.minArea = globalFilters.minArea;
        filtersForApi.maxArea = globalFilters.maxArea;
    }
    // --- Kết thúc xây dựng đối tượng filtersForApi ---

    console.log("⚡ Đang áp dụng bộ lọc và gọi API với:", filtersForApi); // Log để gỡ lỗi

    // 3. GỌI HÀM loadBds TỪ FILE dsbds.js
    if (typeof loadBds === 'function') {
        loadBds(filtersForApi); // filtersForApi sẽ rỗng nếu tất cả mặc định
    } else {
        console.error("Lỗi: Hàm loadBds() không tồn tại. Đảm bảo dsbds.js được tải trước tkbds.js.");
    }

    // 4. Cập nhật badge
    updateFilterCountBadge();
    // 5. Cập nhật URL (tùy chọn)
    updateUrlWithFilters(filtersForApi);
}

// --- Cập nhật URL trình duyệt (không tải lại trang) ---
function updateUrlWithFilters(filters) {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
            params.set(key, filters[key]);
        }
    }
    // Thêm các label giá/diện tích vào URL để dễ dàng phục hồi UI nếu muốn
    if (globalFilters.labelPrice !== DEFAULT_PRICE_LABEL) params.set('labelPrice', globalFilters.labelPrice);
    if (globalFilters.labelArea !== DEFAULT_AREA_LABEL) params.set('labelArea', globalFilters.labelArea);

    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : ''); // Chỉ thêm ? nếu có params
    window.history.pushState({ path: newUrl }, '', newUrl);
}

// Hàm reset cho Modal Bộ lọc nâng cao (được gọi bởi $('#resetAdvancedFilters'))
function resetAdvancedFilters() {
    // Đặt lại globalFilters về trạng thái ban đầu
    globalFilters = {
        searchTerm: "",
        trangThai: "cho_thue",
        loaiBds: "",
        minPrice: 0,
        maxPrice: MAX_PRICE_VALUE,
        labelPrice: DEFAULT_PRICE_LABEL,
        minArea: 0,
        maxArea: MAX_AREA_VALUE,
        labelArea: DEFAULT_AREA_LABEL,
        viTri: ""
    };

    // Reset các trường form trong modal
    $('#filterTrangThai').val('cho_thue');
    $('#filterLoaiBds').val('');
    $('#filterViTri').val('');
    $('#mainSearchInput').val(''); // Reset cả ô tìm kiếm chính

    // Cập nhật lại UI các nút Khoảng giá/Diện tích trong Modal
    $('#filterModalSelectedPrice').text(DEFAULT_PRICE_LABEL).closest('.btn-offcanvas-trigger').addClass('default-value');
    $('#filterModalSelectedArea').text(DEFAULT_AREA_LABEL).closest('.btn-offcanvas-trigger').addClass('default-value');

    // Cập nhật các nút Khoảng giá/Diện tích bên ngoài
    $('#btnPriceFilterOut').text('Khoảng giá').addClass('default-value');
    $('#btnAreaFilterOut').text('Diện tích').addClass('default-value');

    // Reset dropdown "Loại nhà đất" bên ngoài
    $('#dropdownLoaiNha').text("Loại nhà đất");
    $('.dropdown-menu a.dropdown-item').removeClass('active');
    $('.dropdown-menu a.dropdown-item[data-value="all"]').addClass('active');

    // Đóng offcanvas nếu nó đang mở (quan trọng để cập nhật UI của offcanvas)
    const offcanvasPriceInstance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasPrice'));
    if (offcanvasPriceInstance) offcanvasPriceInstance.hide();
    const offcanvasAreaInstance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasArea'));
    if (offcanvasAreaInstance) offcanvasAreaInstance.hide();

    // Đảm bảo offcanvas inputs cũng được reset
    $('#offcanvasMinPriceInput').val('');
    $('#offcanvasMaxPriceInput').val('');
    $('#offcanvasMinAreaInput').val('');
    $('#offcanvasMaxAreaInput').val('');

    // Cập nhật trạng thái lựa chọn trong offcanvas về mặc định (Tất cả mức giá/diện tích)
    $('#offcanvasPriceOptionsContainer .filter-option-item').removeClass('selected').find('.check-icon').hide();
    $('#offcanvasPriceOptionsContainer .filter-option-item[data-min="0"][data-max="max"]').addClass('selected').find('.check-icon').show();
    $('#offcanvasAreaOptionsContainer .filter-option-item').removeClass('selected').find('.check-icon').hide();
    $('#offcanvasAreaOptionsContainer .filter-option-item[data-min="0"][data-max="max"]').addClass('selected').find('.check-icon').show();

    filterAndDisplayResults({trangThai: "cho_thue"}); // Gọi API với bộ lọc rỗng để hiển thị tất cả
    $('#filterModal').modal('hide'); // Đóng modal
}

// --- Hàm chung để xử lý Offcanvas (Khoảng giá & Diện tích) ---
function setupOffcanvasLogic(offcanvasId, minInputId, maxInputId, optionsContainerId, maxValue, type) {
    const $offcanvas = $(`#${offcanvasId}`);
    const $minInput = $(`#${minInputId}`);
    const $maxInput = $(`#${maxInputId}`);
    const $optionsContainer = $(`#${optionsContainerId}`);
    const $btnApply = $(`#apply${offcanvasId}`); // ID của nút Áp dụng
    const $offcanvasBackBtn = $offcanvas.find('.offcanvas-header .bi-arrow-left');

    const defaultLabel = type === 'price' ? DEFAULT_PRICE_LABEL : DEFAULT_AREA_LABEL;

    let localOffcanvasSelection = {}; // Trạng thái tạm thời trong Offcanvas

    // Đồng bộ trạng thái từ global vào local khi offcanvas mở
    $offcanvas.on('show.bs.offcanvas', function() {
        localOffcanvasSelection = {
            min: type === 'price' ? globalFilters.minPrice : globalFilters.minArea,
            max: type === 'price' ? globalFilters.maxPrice : globalFilters.maxArea,
            label: type === 'price' ? globalFilters.labelPrice : globalFilters.labelArea
        };
        updateOffcanvasUI();
    });

    // Hàm cập nhật UI trong Offcanvas
    function updateOffcanvasUI() {
        $optionsContainer.find('.filter-option-item').removeClass('selected').find('.check-icon').hide();
        $minInput.val("");
        $maxInput.val("");

        let foundMatch = false;
        let currentMin = localOffcanvasSelection.min;
        let currentMax = localOffcanvasSelection.max;

        $optionsContainer.find('.filter-option-item').each(function() {
            const itemMin = $(this).data('min');
            let itemMax = $(this).data('max');
            itemMax = (itemMax === 'max' || itemMax === 'custom') ? maxValue : itemMax; // Đảm bảo max là số

            if (currentMin == itemMin && currentMax == itemMax) {
                $(this).addClass('selected').find('.check-icon').show();
                foundMatch = true;
                // Nếu là tùy chỉnh, hiển thị giá trị vào input
                if (itemMin === 'custom') {
                    $minInput.val(currentMin === 0 ? '' : currentMin);
                    $maxInput.val(currentMax === maxValue ? '' : currentMax);
                } else { // Xóa input khi chọn option có sẵn
                    $minInput.val('');
                    $maxInput.val('');
                }
                return false; // Thoát vòng lặp
            }
        });

        // Nếu không khớp với bất kỳ tùy chọn nào, hoặc nếu label là "Tùy chỉnh", chọn "Tùy chỉnh" và điền giá trị
        if (!foundMatch || localOffcanvasSelection.label === "Tùy chỉnh") {
            const $customOption = $optionsContainer.find('.filter-option-item[data-min="custom"]');
            if ($customOption.length) {
                $customOption.addClass('selected').find('.check-icon').show();
                $minInput.val(currentMin === 0 ? '' : currentMin);
                $maxInput.val(currentMax === maxValue ? '' : currentMax);
            } else { // Fallback nếu không có "Tùy chỉnh" và không khớp cái nào, chọn mặc định 'Tất cả'
                $optionsContainer.find('.filter-option-item[data-label="'+defaultLabel+'"]').addClass('selected').find('.check-icon').show();
            }
        }
    }

    // Click vào tùy chọn có sẵn
    $optionsContainer.on('click', '.filter-option-item', function() {
        $optionsContainer.find('.filter-option-item').removeClass('selected').find('.check-icon').hide();
        $(this).addClass('selected').find('.check-icon').show();

        const min = $(this).data('min');
        const max = $(this).data('max');
        const label = $(this).data('label');

        if (min === 'custom') {
            // Khi chọn "Tùy chỉnh", giữ nguyên giá trị đã nhập hoặc 0/maxValue
            localOffcanvasSelection = {
                min: parseFloat($minInput.val()) || 0,
                max: parseFloat($maxInput.val()) || maxValue,
                label: 'Tùy chỉnh'
            };
        } else {
            localOffcanvasSelection = { min: min, max: (max === 'max' || max === 'custom') ? maxValue : max, label: label };
            $minInput.val(min === 0 ? '' : min);
            $maxInput.val((max === 'max' || max === maxValue) ? '' : max); // Clear max input nếu là "max"
        }
    });

    // Nhập giá trị vào ô input (Tùy chỉnh)
    function onInputType() {
        $optionsContainer.find('.filter-option-item').removeClass('selected').find('.check-icon').hide();
        const $customOption = $optionsContainer.find('[data-min="custom"]');
        if($customOption.length) {
            $customOption.addClass('selected').find('.check-icon').show();
        } else {
            // Fallback nếu không có tùy chọn 'custom', có thể chọn 'Tất cả' hoặc không chọn gì
        }
        localOffcanvasSelection.min = parseFloat($minInput.val()) || 0;
        localOffcanvasSelection.max = parseFloat($maxInput.val()) || maxValue;
        localOffcanvasSelection.label = 'Tùy chỉnh'; // Đánh dấu là tùy chỉnh
    }
    $minInput.on('input', onInputType);
    $maxInput.on('input', onInputType);

    // Nút Áp dụng trong Offcanvas
    $btnApply.on('click', function() {
        console.log(`🔔 Nút "Áp dụng" cho ${offcanvasId} đã được click!`); // LOG ĐỂ GỠ LỖI

        let finalMin = parseFloat($minInput.val()) || 0;
        let finalMax = parseFloat($maxInput.val()) || maxValue;
        let finalLabel;

        // Đảm bảo min <= max (chỉ hoán đổi nếu max input có giá trị)
        if (finalMin > finalMax && $maxInput.val() !== '') {
            [finalMin, finalMax] = [finalMax, finalMin]; // Hoán đổi giá trị
            $minInput.val(finalMin === 0 ? '' : finalMin);
            $maxInput.val(finalMax === maxValue ? '' : finalMax);
        }

        // Tạo label cuối cùng
        finalLabel = createRangeLabel(finalMin, finalMax, type);

        // Cập nhật globalFilters với các giá trị mới
        const newFilters = {};
        if (type === 'price') {
            newFilters.minPrice = finalMin;
            newFilters.maxPrice = finalMax;
            newFilters.labelPrice = finalLabel;
            // Cập nhật text cho nút trong Modal và nút ngoài
            $('#filterModalSelectedPrice').text(finalLabel);
            $('#btnModalPrice').toggleClass('default-value', finalLabel === DEFAULT_PRICE_LABEL);
            $('#btnPriceFilterOut').text(finalLabel === DEFAULT_PRICE_LABEL ? "Khoảng giá" : finalLabel).toggleClass('default-value', finalLabel === DEFAULT_PRICE_LABEL);
        } else { // type === 'area'
            newFilters.minArea = finalMin;
            newFilters.maxArea = finalMax;
            newFilters.labelArea = finalLabel;
            // Cập nhật text cho nút trong Modal và nút ngoài
            $('#filterModalSelectedArea').text(finalLabel);
            $('#btnModalArea').toggleClass('default-value', finalLabel === DEFAULT_AREA_LABEL);
            $('#btnAreaFilterOut').text(finalLabel === DEFAULT_AREA_LABEL ? "Diện tích" : finalLabel).toggleClass('default-value', finalLabel === DEFAULT_AREA_LABEL);
        }

        filterAndDisplayResults(newFilters); // Kích hoạt tìm kiếm VỚI BỘ LỌC MỚI

        // Đóng offcanvas
        if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance($offcanvas[0]);
            if (offcanvasInstance) offcanvasInstance.hide();
        }
    });

    // Nút quay lại trong Offcanvas
    $offcanvasBackBtn.on('click', function() {
        if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance($offcanvas[0]);
            if (offcanvasInstance) offcanvasInstance.hide();
        }
    });
}


// =========================================================
// 3. CODE KHỞI TẠO KHI TRANG ĐÃ SẴN SÀNG (trong $(document).ready)
// =========================================================
$(document).ready(function() {

    // --- Main Search Bar ---
    $('#btnMainSearch').on('click', function() {
        const searchTerm = $('#mainSearchInput').val().trim();
        filterAndDisplayResults({ searchTerm: searchTerm });
    });

    $('#mainSearchInput').on('keypress', function(e) {
        if (e.which === 13) $('#btnMainSearch').click();
    });

    // --- Logic cho Dropdown "Loại nhà đất" (Nút ngoài) ---
    // Khởi tạo text và trạng thái active ban đầu
    $('#dropdownLoaiNha').text("Loại nhà đất"); // Đặt lại text mặc định
    // Đảm bảo item 'all' có class 'active' nếu chưa có loaiBds nào được chọn từ URL
    if (!globalFilters.loaiBds || globalFilters.loaiBds === 'all') {
        $('.dropdown-menu a.dropdown-item[data-value="all"]').addClass('active');
    }

    $('.dropdown-menu a.dropdown-item').on('click', function(e) {
        e.preventDefault();
        const $selectedItem = $(this);
        const selectedValue = $selectedItem.data('value'); // Giá trị từ data-value

        $('.dropdown-menu a.dropdown-item').removeClass('active');
        $selectedItem.addClass('active');
        $('#dropdownLoaiNha').text($selectedItem.text());

        // Cập nhật globalFilters và kích hoạt tìm kiếm
        filterAndDisplayResults({ loaiBds: selectedValue });
    });

    // --- Khởi tạo Offcanvas Khoảng giá ---
    setupOffcanvasLogic(
        'offcanvasPrice', 'offcanvasMinPriceInput', 'offcanvasMaxPriceInput',
        'offcanvasPriceOptionsContainer', MAX_PRICE_VALUE, 'price'
    );
    // --- Khởi tạo Offcanvas Diện tích ---
    setupOffcanvasLogic(
        'offcanvasArea', 'offcanvasMinAreaInput', 'offcanvasMaxAreaInput',
        'offcanvasAreaOptionsContainer', MAX_AREA_VALUE, 'area'
    );

    // --- Logic cho Modal "Bộ lọc nâng cao" ---
    // Khi Modal được hiển thị, đồng bộ trạng thái global vào UI của modal
    $('#filterModal').on('show.bs.modal', function() {
        // Đồng bộ các selectbox/input khác
        $('#filterTrangThai').val(globalFilters.trangThai);
        $('#filterLoaiBds').val(globalFilters.loaiBds);
        $('#filterViTri').val(globalFilters.viTri);

        // Cập nhật UI cho các nút Khoảng giá/Diện tích trong Modal
        $('#filterModalSelectedPrice').text(globalFilters.labelPrice);
        $('#btnModalPrice').toggleClass('default-value', globalFilters.labelPrice === DEFAULT_PRICE_LABEL);

        $('#filterModalSelectedArea').text(globalFilters.labelArea);
        $('#btnModalArea').toggleClass('default-value', globalFilters.labelArea === DEFAULT_AREA_LABEL);
    });

    // Nút "Áp dụng bộ lọc" trong Modal
    $('#applyAdvancedFilters').on('click', function() {
        console.log("🔔 Nút 'Áp dụng bộ lọc' trong Modal đã được click!"); // LOG ĐỂ GỠ LỖI

        // Thu thập tất cả các bộ lọc từ UI trong modal
        const newFilters = {
            searchTerm: $('#mainSearchInput').val().trim(), // Giữ lại search term chính
            trangThai: $('#filterTrangThai').val(),
            loaiBds: $('#filterLoaiBds').val(),
            viTri: $('#filterViTri').val().trim(),
            // Giá trị min/max/label cho giá và diện tích đã được cập nhật vào globalFilters
            // khi Offcanvas tương ứng được áp dụng. Ta chỉ cần dùng lại globalFilters ở đây.
            minPrice: globalFilters.minPrice,
            maxPrice: globalFilters.maxPrice,
            labelPrice: globalFilters.labelPrice,
            minArea: globalFilters.minArea,
            maxArea: globalFilters.maxArea,
            labelArea: globalFilters.labelArea
        };

        filterAndDisplayResults(newFilters); // Kích hoạt tìm kiếm
        bootstrap.Modal.getInstance($('#filterModal')[0]).hide(); // Đóng modal
    });

    // Nút "Đặt lại" trong Modal "Bộ lọc nâng cao"
    $('#resetAdvancedFilters').on('click', function() {
        console.log("🔔 Nút 'Đặt lại' trong Modal đã được click!"); // LOG ĐỂ GỠ LỖI
        resetAdvancedFilters(); // Gọi hàm resetAdvancedFilters đã định nghĩa ở trên
    });

    // Xử lý sự kiện click cho nút Đặt lại trong Offcanvas Khoảng giá
    $('#resetOffcanvasPrice').on('click', function() {
        console.log("🔔 Nút 'Đặt lại' trong Offcanvas Price đã được click!"); // LOG ĐỂ GỠ LỖI
        // Reset các giá trị trong globalFilters cho giá
        globalFilters.minPrice = 0;
        globalFilters.maxPrice = MAX_PRICE_VALUE;
        globalFilters.labelPrice = DEFAULT_PRICE_LABEL;

        // Reset UI của offcanvas (input và các lựa chọn)
        $('#offcanvasMinPriceInput').val('');
        $('#offcanvasMaxPriceInput').val('');
        $('#offcanvasPriceOptionsContainer .filter-option-item').removeClass('selected').find('.check-icon').hide();
        $('#offcanvasPriceOptionsContainer .filter-option-item[data-min="0"][data-max="max"]').addClass('selected').find('.check-icon').show();

        // Cập nhật UI nút Price trên thanh filter và trong modal
        $('#btnPriceFilterOut').text('Khoảng giá').addClass('default-value');
        $('#filterModalSelectedPrice').text(DEFAULT_PRICE_LABEL).closest('.btn-offcanvas-trigger').addClass('default-value');

        filterAndDisplayResults({}); // Gọi API với bộ lọc rỗng để reset
        // Đóng offcanvas
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasPrice'));
        if (offcanvasInstance) offcanvasInstance.hide();
    });

    // Xử lý sự kiện click cho nút Đặt lại trong Offcanvas Diện tích
    $('#resetOffcanvasArea').on('click', function() {
        console.log("🔔 Nút 'Đặt lại' trong Offcanvas Area đã được click!"); // LOG ĐỂ GỠ LỖI
        // Reset các giá trị trong globalFilters cho diện tích
        globalFilters.minArea = 0;
        globalFilters.maxArea = MAX_AREA_VALUE;
        globalFilters.labelArea = DEFAULT_AREA_LABEL;

        // Reset UI của offcanvas (input và các lựa chọn)
        $('#offcanvasMinAreaInput').val('');
        $('#offcanvasMaxAreaInput').val('');
        $('#offcanvasAreaOptionsContainer .filter-option-item').removeClass('selected').find('.check-icon').hide();
        $('#offcanvasAreaOptionsContainer .filter-option-item[data-min="0"][data-max="max"]').addClass('selected').find('.check-icon').show();

        // Cập nhật UI nút Area trên thanh filter và trong modal
        $('#btnAreaFilterOut').text('Diện tích').addClass('default-value');
        $('#filterModalSelectedArea').text(DEFAULT_AREA_LABEL).closest('.btn-offcanvas-trigger').addClass('default-value');

        filterAndDisplayResults({}); // Gọi API với bộ lọc rỗng để reset
        // Đóng offcanvas
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasArea'));
        if (offcanvasInstance) offcanvasInstance.hide();
    });


    // ===================================================
    // RUN ON LOAD (Khôi phục trạng thái và chạy tìm kiếm ban đầu)
    // ===================================================
    function restoreFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        let restoredFilters = {};

        for (const key of params.keys()) {
            const value = params.get(key);
            if (key === 'minPrice' || key === 'maxPrice') {
                restoredFilters[key] = parseFloat(value) / ONE_MILLION;
            } else if (key === 'minArea' || key === 'maxArea') {
                restoredFilters[key] = parseFloat(value);
            }
             else {
                restoredFilters[key] = value;
            }
        }

        // Cập nhật globalFilters với các giá trị từ URL
        globalFilters = { ...globalFilters, ...restoredFilters };

        // Cập nhật UI cho Main Search Input
        if (globalFilters.searchTerm) {
            $('#mainSearchInput').val(globalFilters.searchTerm);
        }

        // Cập nhật UI cho Dropdown "Loại nhà đất" (Nút ngoài)
        const loaiBdsValue = globalFilters.loaiBds || 'all';
        const $selectedLoaiNhaItem = $(`.dropdown-menu a.dropdown-item[data-value="${loaiBdsValue}"]`);
        $('.dropdown-menu a.dropdown-item').removeClass('active');
        if ($selectedLoaiNhaItem.length) {
            $selectedLoaiNhaItem.addClass('active');
            $('#dropdownLoaiNha').text($selectedLoaiNhaItem.text());
        } else {
            $('#dropdownLoaiNha').text("Loại nhà đất");
            $(`.dropdown-menu a.dropdown-item[data-value="all"]`).addClass('active');
        }

        // Cập nhật UI cho các nút Khoảng giá/Diện tích bên ngoài
        $('#btnPriceFilterOut').text(globalFilters.labelPrice === DEFAULT_PRICE_LABEL ? "Khoảng giá" : globalFilters.labelPrice).toggleClass('default-value', globalFilters.labelPrice === DEFAULT_PRICE_LABEL);
        $('#btnAreaFilterOut').text(globalFilters.labelArea === DEFAULT_AREA_LABEL ? "Diện tích" : globalFilters.labelArea).toggleClass('default-value', globalFilters.labelArea === DEFAULT_AREA_LABEL);

        // Sau khi khôi phục xong, gọi filterAndDisplayResults để tải dữ liệu ban đầu
        filterAndDisplayResults({}); // Gọi với object rỗng để kích hoạt tìm kiếm với globalFilters hiện tại
    }

    restoreFiltersFromUrl(); // Khôi phục trạng thái và tìm kiếm khi tải trang
}); // Kết thúc $(document).ready()