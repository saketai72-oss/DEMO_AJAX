/* ========================================
   MOCK DATA - 100 Employee Records
   ======================================== */

const DEPARTMENTS = [
    'Kỹ thuật', 'Marketing', 'Bán hàng', 'Nhân sự',
    'Tài chính', 'Thiết kế', 'Vận hành', 'Hỗ trợ KH'
];

const ROLES = [
    'Trưởng phòng', 'Phó phòng', 'Nhân viên', 'Thực tập sinh',
    'Senior', 'Junior', 'Lead', 'Chuyên viên'
];

const FIRST_NAMES = [
    'Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Minh',
    'Hoàng Thị', 'Vũ Đức', 'Đặng Thị', 'Bùi Quang',
    'Đỗ Thị', 'Ngô Thanh', 'Dương Văn', 'Lý Thị',
    'Trịnh Quốc', 'Đinh Thị', 'Hồ Xuân', 'Phan Văn',
    'Huỳnh Thị', 'Mai Đức', 'Tạ Thị', 'Cao Minh'
];

const LAST_NAMES = [
    'An', 'Bình', 'Cường', 'Dung', 'Hà', 'Hùng', 'Khoa',
    'Lan', 'Long', 'Mai', 'Nam', 'Ngọc', 'Phúc', 'Quân',
    'Sơn', 'Thảo', 'Tú', 'Uyên', 'Vinh', 'Yến', 'Đạt',
    'Hải', 'Khánh', 'Linh', 'Minh', 'Phương', 'Thắng',
    'Tuấn', 'Xuân', 'Dũng'
];

const STATUSES = ['active', 'inactive', 'pending'];

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#eab308', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
];

function generateMockData(count) {
    const data = [];

    for (let i = 1; i <= count; i++) {
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const fullName = `${firstName} ${lastName}`;
        const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
        const role = ROLES[Math.floor(Math.random() * ROLES.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

        const baseSalary = role === 'Trưởng phòng' ? 35000000 :
                          role === 'Phó phòng' ? 28000000 :
                          role === 'Lead' ? 30000000 :
                          role === 'Senior' ? 25000000 :
                          role === 'Chuyên viên' ? 18000000 :
                          role === 'Nhân viên' ? 15000000 :
                          role === 'Junior' ? 12000000 :
                          8000000;
        const salary = baseSalary + Math.floor(Math.random() * 8000000);

        const year = 2018 + Math.floor(Math.random() * 8);
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const joinDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const emailName = fullName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/\s+/g, '.')
            .toLowerCase();

        data.push({
            id: i,
            name: fullName,
            email: `${emailName}${i}@company.vn`,
            department,
            role,
            salary,
            status,
            joinDate,
            avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length]
        });
    }

    return data;
}

// Generate 100 records
const MOCK_DATABASE = generateMockData(100);
