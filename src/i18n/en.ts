// English messages keyed by the Vietnamese source text. Keep placeholders such as {name}
// identical to the key. Plural forms: { one: '...', other: '...' } selected by params.count.
export type EnMessage = string | { one: string; other: string };
export const en = {
  'Đang kiểm tra phiên…': 'Checking session…',
  'Đăng nhập': 'Sign in',
  'Đăng xuất': 'Sign out',
  'Đến nội dung chính': 'Skip to main content',
  'Mở rộng thanh menu': 'Expand sidebar',
  'Thu gọn thanh menu': 'Collapse sidebar',
  'Điều hướng chính': 'Main navigation',
  'Tổng quan': 'Overview',
  'Liên kết của tôi': 'My links',
  'Cần gói dịch vụ': 'Requires a service plan',
  '(cần gói dịch vụ)': '(requires a service plan)',
  'Lịch sử cuộc gọi': 'Call history',
  'Thanh toán': 'Payments',
  'Nhật ký chỉ dẫn di chuyển': 'Navigation guidance log',
  'Máy chủ hỗ trợ cuộc gọi': 'Call relay servers',
  'Gói dịch vụ': 'Service plans',
  'Mở điều hướng': 'Open navigation',
  'Menu tài khoản': 'Account menu',
  'Hồ sơ của tôi': 'My profile',
  'Đang đăng xuất…': 'Signing out…',
  '● Chế độ demo · Dữ liệu mô phỏng, chưa kết nối máy chủ':
    '● Demo mode · Simulated data, not connected to the backend',
  'Khôi phục dữ liệu demo': 'Reset demo data',
  'Đang tải màn hình…': 'Loading screen…',
  'Khôi phục dữ liệu demo?': 'Reset demo data?',
  'Xóa toàn bộ thay đổi, ảnh demo và phiên đăng nhập trên trình duyệt này để trở về dữ liệu mẫu.':
    'Clears all changes, demo photos and the sign-in session in this browser and restores the sample data.',
  'Về tổng quan': 'Back to overview',
  'Quay lại trang trước': 'Go back',
  'Về trang chủ': 'Back to home',
  'Nhật ký thao tác': 'Audit log',
  'Theo dõi thông báo': 'Notification delivery',
  'Hiệu năng AI': 'AI performance',
  'Quy tắc thông báo': 'Notification rules',
  'Cấu hình hệ thống': 'System configuration',
  'Liên kết chăm sóc': 'Care links',
  'Quản lý tài khoản': 'Account management',
  'Tổ chức & trung tâm': 'Organizations & centers',
  'Định tuyến thông báo': 'Notification routing',
  'Báo cáo hoạt động': 'Activity reports',
  'Bản đồ toàn trung tâm': 'Center-wide map',
  'Phân công chăm sóc': 'Care assignments',
  'Nhân viên chăm sóc': 'Care staff',
  'Giọng đọc hỗ trợ': 'Voice assistant',
  'Tùy chọn thông báo': 'Notification preferences',
  'Nhật ký hoạt động': 'Activity log',
  'Người chăm sóc phụ': 'Secondary caregivers',
  'Liên hệ khẩn cấp': 'Emergency contacts',
  'Địa điểm & vùng an toàn': 'Places & safe zones',
  'Gương mặt thân quen': 'Familiar faces',
  'Cảnh báo khẩn cấp': 'Emergency alerts',
  'Bản đồ theo dõi': 'Tracking map',
  'Người được chăm sóc': 'Care recipients',
  'Chưa kết nối dịch vụ cuộc gọi. Nếu chờ lâu, kiểm tra mạng rồi tải lại trang.':
    'Not connected to the call service. If this takes long, check your network and reload the page.',
  'Gọi hỗ trợ': 'Support call',
  'Gọi ': 'Call ',
  'Web sẽ bật micro để bạn trò chuyện và nhận hình ảnh từ người được chăm sóc. Camera của bạn không được bật.':
    'The Web will turn on your microphone so you can talk and receive video from the care recipient. Your camera stays off.',
  'Bắt đầu gọi': 'Start call',
  'Cuộc gọi đến từ ': 'Incoming call from ',
  'Cuộc gọi hỗ trợ đến': 'Incoming support call',
  'Micro chỉ bật khi bạn nhận cuộc gọi. Camera của bạn không bật.':
    'The microphone turns on only when you answer. Your camera stays off.',
  'Từ chối': 'Decline',
  'Nhận cuộc gọi': 'Answer',
  'Trình duyệt chặn tự phát. Nhấn Phát âm thanh và hình ảnh.':
    'The browser blocked autoplay. Press Play audio and video.',
  'Cuộc gọi với ': 'Call with ',
  'Mở rộng cuộc gọi': 'Expand call',
  'Thu nhỏ cuộc gọi': 'Minimize call',
  'Mở rộng': 'Expand',
  'Thu nhỏ': 'Minimize',
  'Có cuộc gọi khác cần kiểm tra. Kết thúc cuộc gọi hiện tại rồi đóng bảng để kiểm tra lại trên máy chủ.':
    'Another call needs checking. End the current call, then close the panel to re-check on the server.',
  'Hình ảnh và âm thanh từ người được chăm sóc': 'Video and audio from the care recipient',
  'Đang chờ âm thanh và hình ảnh': 'Waiting for audio and video',
  'Hình ảnh sẽ xuất hiện khi thiết bị kết nối.': 'Video will appear when the device connects.',
  'Hình ảnh từ người được chăm sóc': 'Video from the care recipient',
  'Trong cuộc gọi': 'In call',
  'Micro của bạn': 'Your microphone',
  'Đang chuẩn bị': 'Preparing',
  'Đã tắt': 'Off',
  'Đang bật': 'On',
  'Camera của bạn': 'Your camera',
  'Không bật': 'Not on',
  'Thu nhỏ để xem bản đồ hoặc thông tin người thân trong khi trò chuyện.':
    "Minimize to view the map or the recipient's details while talking.",
  'Web không ghi âm hoặc lưu video.': 'The Web does not record audio or save video.',
  'Phát âm thanh và hình ảnh': 'Play audio and video',
  'Không thể phát. Kiểm tra thiết bị âm thanh của bạn.': 'Cannot play. Check your audio device.',
  'Bạn có thể đóng bảng và xem lại lịch sử cuộc gọi.':
    'You can close the panel and review the call history.',
  'Thu nhỏ không kết thúc cuộc gọi.': 'Minimizing does not end the call.',
  Đóng: 'Close',
  'Bật micro': 'Unmute microphone',
  'Tắt micro': 'Mute microphone',
  'Kết thúc cuộc gọi': 'End call',
  'Lưu thay đổi': 'Save changes',
  'Cần nhập một số hợp lệ.': 'Enter a valid number.',
  'Mật khẩu cần ít nhất 8 ký tự.': 'Password must be at least 8 characters.',
  'Vui lòng nhập thông tin.': 'Please fill in this field.',
  'Cần ít nhất {min} ký tự.': 'Enter at least {min} characters.',
  'Gói dịch vụ của tài khoản do trung tâm quản lý. Hãy liên hệ quản trị trung tâm để gia hạn.':
    "This account's license is managed by your center. Contact your center admin to renew it.",
  'Email không hợp lệ.': 'Invalid email.',
  'Không thể lưu thay đổi.': 'Could not save changes.',
  'Chọn…': 'Select…',
  'Chọn điểm trên sơ đồ demo hoặc nhập tọa độ chính xác ở trên. Không phải bản đồ địa lý.':
    'Pick a point on the demo diagram or enter exact coordinates above. This is not a geographic map.',
  'Chọn vị trí trên sơ đồ demo; dùng ô tọa độ để nhập bằng bàn phím':
    'Pick a location on the demo diagram; use the coordinate fields to enter it with the keyboard',
  'Tâm: {p1}, {p3} · {p5} m': 'Center: {p1}, {p3} · {p5} m',
  'Đang xử lý…': 'Processing…',
  'Mỗi người khiếm thị có tối đa {maxCaregivers} người chăm sóc, mỗi người chăm sóc theo dõi tối đa {maxVius} người khiếm thị. Luôn giữ một người chăm sóc chính.':
    'Each visually impaired user has at most {maxCaregivers} caregivers, and each caregiver follows at most {maxVius} visually impaired users. Always keep one primary caregiver.',
  'Thêm liên kết': 'Add link',
  'Chỉ người chăm sóc chính được quản lý liên kết này.':
    'Only the primary caregiver can manage this link.',
  'Liên kết đang có': 'Current links',
  'Người chăm sóc': 'Caregiver',
  'Người dùng': 'User',
  'Vai trò': 'Role',
  Chính: 'Primary',
  Phụ: 'Secondary',
  Quyền: 'Permissions',
  'Cảnh báo': 'Alerts',
  'Địa điểm': 'Places',
  'Chỉ xem': 'View only',
  'Thao tác': 'Actions',
  'Đặt làm chính': 'Make primary',
  Gỡ: 'Remove',
  'Thêm liên kết chăm sóc': 'Add care link',
  'Email người chăm sóc đã đăng ký': 'Registered caregiver email',
  'Người khiếm thị': 'Visually impaired user',
  'Người chăm sóc chính (khi chưa có)': 'Primary caregiver (if none yet)',
  'Quyền trên người dùng được liên kết': 'Permissions on the linked user',
  'Nhận và xử lý cảnh báo': 'Receive and handle alerts',
  'Quản lý danh bạ gương mặt': 'Manage the face registry',
  'Quản lý địa điểm và vùng an toàn': 'Manage places and geofences',
  'Gỡ liên kết chăm sóc?': 'Remove care link?',
  'Gỡ {name} khỏi {name2}. Quyền truy cập sẽ bị thu hồi.':
    'Remove {name} from {name2}. Their access will be revoked.',
  'Chuyển người chăm sóc chính?': 'Transfer primary caregiver?',
  'Chuyển vai trò chính sang {name}. {p1}': 'Transfer the primary role to {name}. {p1}',
  'Sơ đồ vị trí mô phỏng': 'Simulated location diagram',
  'Chọn ': 'Select ',
  'Chưa có dữ liệu vị trí.': 'No location data yet.',
  'Sơ đồ mô phỏng · Không phải bản đồ đường đi · Chưa kết nối Mapbox':
    'Simulated diagram · Not a route map · Mapbox not connected',
  'Họ và tên': 'Full name',
  'Số điện thoại': 'Phone number',
  'Tổ chức (bắt buộc khi tạo nhân viên, người khiếm thị hoặc quản trị trung tâm)':
    'Organization (required for Staff/VIU/Center Admin)',
  'Tạo và cập nhật tài khoản trong phạm vi được cấp quyền. Vô hiệu hóa sẽ thu hồi quyền đăng nhập.':
    'Create and update accounts within your granted scope. Deactivating revokes sign-in access.',
  'Thêm tài khoản': 'Add account',
  'Trạng thái tài khoản': 'Account status',
  'Tất cả trạng thái': 'All statuses',
  'Đang hoạt động': 'Active',
  'Ngừng hoạt động': 'Inactive',
  'Vai trò tài khoản': 'Account role',
  'Tất cả vai trò': 'All roles',
  'Tài khoản': 'Account',
  'Vai trò / tổ chức': 'Role / organization',
  'Cá nhân': 'Personal',
  'Phân công': 'Assignment',
  'Trạng thái': 'Status',
  'Hoạt động': 'Active',
  'Đã vô hiệu hóa': 'Deactivated',
  'Chỉnh sửa': 'Edit',
  'Đặt lại mật khẩu': 'Reset password',
  'Vô hiệu hóa': 'Deactivate',
  'Kích hoạt': 'Activate',
  'Chỉnh sửa tài khoản': 'Edit account',
  'Tạo tài khoản demo': 'Create demo account',
  'Tài khoản demo mới dùng mật khẩu Demo@123. Không có email thật được gửi. Người khiếm thị chỉ đăng nhập trên ứng dụng điện thoại.':
    'New demo accounts use the password Demo@123. No real email is sent. VIUs sign in only on the Mobile app.',
  'Tài khoản sẽ không đăng nhập được. Liên kết vẫn được giữ để quản trị viên phân công lại; không tự chuyển người chăm sóc chính.':
    'The account will not be able to sign in. Links are kept so an administrator can reassign them; the primary caregiver is not transferred automatically.',
  'Khôi phục quyền đăng nhập theo vai trò và liên kết hiện tại.':
    'Restores sign-in access according to the current role and links.',
  'Đặt lại mật khẩu cho {name}?': 'Reset the password for {name}?',
  'Tạo mã đặt lại mật khẩu demo. Không gửi email thật.':
    'Creates a demo password reset code. No real email is sent.',
  'Mã khôi phục demo': 'Demo recovery code',
  'Dùng mã ở trang khôi phục mật khẩu. Chưa gửi email thật.':
    'Use the code on the password recovery page. No real email has been sent.',
  'Thông báo trên trình duyệt': 'Browser notifications',
  'Đã đăng ký nhận thông báo đẩy cho phiên này.': 'Push is registered for this session.',
  'Chưa đăng ký thông báo đẩy cho phiên này.': 'Push is not registered for this session.',
  'Thông báo chỉ hiển thị lời nhắc chung. Mở trang quản lý để xem dữ liệu theo quyền của bạn. Mỗi trình duyệt nhận thông báo đẩy cho một phiên; bật ở tab khác sẽ thay phiên nhận. Đăng xuất hoặc tắt ở một tab sẽ tắt thông báo đẩy trên trình duyệt này.':
    'Notifications show only a generic reminder. Open the Dashboard to see data according to your permissions. Each browser receives push for one session; enabling it in another tab moves delivery there. Signing out or turning it off in one tab disables push in this browser.',
  'Trình duyệt chưa hỗ trợ hoặc trang chưa dùng HTTPS.':
    'The browser does not support it or the page is not served over HTTPS.',
  'Đã bật thông báo trên trình duyệt này.': 'Notifications are on for this browser.',
  'Không đăng ký được thông báo đẩy. Kiểm tra quyền thông báo, kết nối rồi thử lại.':
    'Could not register push. Check notification permission and connection, then try again.',
  'Đồng bộ đăng ký thông báo đẩy': 'Sync push registration',
  'Bật thông báo trình duyệt': 'Enable browser notifications',
  'Tắt thông báo đẩy trên trình duyệt': 'Turn off push in this browser',
  'Đã tắt thông báo trên trình duyệt này. Các tùy chọn thông báo khác vẫn giữ nguyên.':
    'Notifications are off for this browser. Your other notification options stay the same.',
  'Chưa xác nhận tắt thông báo đẩy. Hãy chặn thông báo trong cài đặt trình duyệt.':
    'Turning off push was not confirmed. Block notifications in the browser settings.',
  'Thêm mới': 'Add new',
  'Chưa có người được liên kết.': 'No linked users yet.',
  'Thay đổi được lưu sau khi kiểm tra quyền và dữ liệu.':
    'Changes are saved after permission and data checks.',
  'Bạn đang có quyền xem; không có quyền chỉnh sửa mục này.':
    'You have view access; you cannot edit this item.',
  'Lọc hoạt động': 'Filter by activity',
  'Tất cả': 'All',
  'Chưa hoạt động': 'Not active',
  Tên: 'Name',
  'Thông tin': 'Details',
  Xóa: 'Delete',
  'Chỉnh sửa: ': 'Edit: ',
  'Thêm mới: ': 'Add new: ',
  'Thay đổi trạng thái tổ chức?': 'Change the organization status?',
  'Thay đổi quyền đăng nhập của thành viên thuộc ': 'Changes sign-in access for members of ',
  '. Xác nhận tiếp tục?': '. Continue?',
  'Xóa {name}?': 'Delete {name}?',
  'Thao tác xóa không thể hoàn tác. Dữ liệu chỉ được bỏ khỏi giao diện sau khi dịch vụ xác nhận thành công.':
    'Deletion cannot be undone. Data is removed from the interface only after the service confirms success.',
  'Quy tắc thông báo toàn hệ thống': 'System-wide notification rules',
  'Quy định kênh và mức bắt buộc mặc định của các loại sự kiện.':
    'Defines the default channels and mandatory level for each event type.',
  'Tạo quy tắc ghi đè cho trung tâm. Không có ghi đè thì dùng quy tắc toàn hệ thống; chưa gửi thông báo thật.':
    'Create override rules for the center. Without an override the system-wide rule applies; no real notifications are sent.',
  'Loại sự kiện': 'Event type',
  'SOS khẩn cấp': 'Emergency SOS',
  'Té ngã': 'Fall',
  'Vùng an toàn': 'Safe zone',
  'Pin yếu': 'Low battery',
  'Kênh thông báo đẩy': 'Push channel',
  'Kênh email': 'Email channel',
  'Thông báo bắt buộc': 'Mandatory notification',
  'Email bàn trực (tùy chọn)': 'Duty desk email (optional)',
  'Địa chỉ nhận bổ sung trong quy tắc demo; chưa dùng để gửi thông báo thật.':
    'Additional recipient in the demo rule; real routing awaits the BE contract.',
  'Bắt buộc': 'Mandatory',
  'Tùy chọn': 'Optional',
  'Người nhận theo liên kết': 'Recipients by link',
  'Vị trí gần nhất và tình trạng kết nối của người được chăm sóc.':
    'Latest location and connection status of the care recipient.',
  'Cập nhật trực tiếp (mô phỏng)': 'Simulated realtime',
  'Đã ngắt kết nối': 'Disconnected',
  'Đang kết nối lại…': 'Reconnecting…',
  'Chưa cấu hình cập nhật trực tiếp': 'SignalR not configured',
  'Trạng thái vị trí': 'Location status',
  'Cập nhật gần đây': 'Recently updated',
  'Dữ liệu cũ': 'Stale data',
  'Có cảnh báo đang mở': 'Has open alerts',
  'Mô phỏng ngắt kết nối': 'Simulate disconnect',
  'Kết nối lại': 'Reconnect',
  'Mô phỏng vị trí cũ': 'Simulate stale location',
  'Vị trí cũ, không phải trực tiếp': 'Stale location, not live',
  'Cập nhật gần đây · dữ liệu mô phỏng': 'Recently updated · simulated data',
  'Danh sách vị trí': 'Location list',
  'Tọa độ (vĩ độ, kinh độ)': 'Coordinates (latitude, longitude)',
  'Pin / mạng': 'Battery / network',
  'Độ chính xác': 'Accuracy',
  'Ghi nhận': 'Recorded',
  'Gần đây': 'Recent',
  'Đóng thông báo': 'Dismiss notification',
  'Đang tải dữ liệu…': 'Loading data…',
  'Chọn gói dịch vụ': 'Choose a service plan',
  'Xem trạng thái gói dịch vụ': 'View license status',
  'Thử lại': 'Retry',
  'Đóng hộp thoại': 'Close dialog',
  Hủy: 'Cancel',
  'Không thể thực hiện.': 'Could not complete the action.',
  'Xác nhận': 'Confirm',
  'Tìm kiếm {title}': 'Search {title}',
  'Tìm kiếm…': 'Search…',
  'Chưa có dữ liệu phù hợp. Thử thay đổi bộ lọc hoặc thêm dữ liệu mới.':
    'No matching data. Try changing the filters or adding new data.',
  '{length} kết quả · Trang {current}/{pages}': '{length} results · Page {current}/{pages}',
  'Trang trước': 'Previous page',
  'Chưa có người được liên kết': 'No linked users yet',
  'VITE_SERVICE_MODE phải là mock hoặc api.': 'VITE_SERVICE_MODE must be mock or api.',
  'Quản trị trung tâm': 'Center administrator',
  'Quản trị hệ thống': 'System administrator',
  'Đã phát hiện': 'Detected',
  'Đã hủy': 'Dismissed',
  'Chờ hỗ trợ': 'Awaiting help',
  'Đang hỗ trợ': 'Being helped',
  'Đã chuyển cấp': 'Escalated',
  'Đã giải quyết': 'Resolved',
  'Đã gọi hỗ trợ': 'Help called',
  'Di chuyển': 'Movement',
  'Đọc văn bản': 'Text reading',
  'Quét QR': 'QR scan',
  'Nhận diện': 'Recognition',
  'Lệnh giọng nói': 'Voice command',
  'Không thể xin quyền thông báo. Kiểm tra cài đặt trình duyệt.':
    'Could not request notification permission. Check the browser settings.',
  'Đã lưu thay đổi trong dữ liệu demo.': 'Changes saved in the demo data.',
  'Đã thoát phiên trên trình duyệt, nhưng chưa xác nhận được thu hồi phiên trên máy chủ.':
    'Signed out in this browser, but revoking the session on the server was not confirmed.',
  'Đã thu hồi phiên đăng nhập trên các thiết bị. Vui lòng đăng nhập lại.':
    'Sign-in sessions have been revoked on all devices. Please sign in again.',
  'Đã thoát trên tab này, nhưng chưa xác nhận thu hồi phiên trên các thiết bị khác. Đăng nhập lại để thử lại.':
    'Signed out in this tab, but revoking sessions on other devices was not confirmed. Sign in again to retry.',
  'Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.':
    'Password reset. Please sign in with your new password.',
  'Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.':
    'Password changed. Please sign in again with your new password.',
  'Chào mừng trở lại.': 'Welcome back.',
  'Khôi phục mật khẩu': 'Recover password',
  'Đặt mật khẩu mới': 'Set a new password',
  'Địa chỉ email': 'Email address',
  'Mã hoặc liên kết khôi phục': 'Recovery code or link',
  'Mật khẩu mới': 'New password',
  'Nhập lại mật khẩu mới': 'Confirm new password',
  'Mật khẩu': 'Password',
  'Nhập lại mật khẩu': 'Confirm password',
  '← Về trang chủ': '← Back to home',
  'Đang kiểm tra phiên đã lưu…': 'Checking saved session…',
  'Không khôi phục được phiên. Bạn có thể đăng nhập lại. {message}':
    'Could not restore the session. You can sign in again. {message}',
  'Tạo tài khoản người chăm sóc gia đình.': 'Create a family caregiver account.',
  'Dùng email bạn đã đăng ký.': 'Use the email you registered with.',
  'Bản demo · Dữ liệu giả lưu trên trình duyệt. Mật khẩu mẫu:':
    'Demo · Fake data stored in the browser. Sample password:',
  '. Không nhập dữ liệu hoặc mật khẩu thật.': '. Do not enter real data or passwords.',
  'Chọn tài khoản demo': 'Choose a demo account',
  'Liên kết khôi phục thiếu hoặc không hợp lệ. Hãy yêu cầu email mới qua Quên mật khẩu.':
    'The recovery link is missing or invalid. Request a new email via Forgot password.',
  'Tạo tài khoản': 'Create account',
  'Tạo yêu cầu khôi phục': 'Request recovery',
  'Đặt mật khẩu': 'Set password',
  'Mật khẩu xác nhận không khớp.': 'Passwords do not match.',
  'Mô phỏng yêu cầu khôi phục. Chưa gửi email thật. Mã demo chỉ dùng với email tồn tại: ':
    'Simulated recovery request. No real email sent. The demo code only works with an existing email: ',
  'Đã đổi mật khẩu demo. Bạn có thể đăng nhập lại.':
    'Demo password changed. You can sign in again.',
  'Quên mật khẩu?': 'Forgot password?',
  'Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.':
    'Password must be 8–100 characters with uppercase, lowercase, a number and a special character.',
  'Đăng ký': 'Sign up',
  'Nhập mã khôi phục': 'Enter recovery code',
  'Hệ thống hỗ trợ người khiếm thị · FA26SE013':
    'Assistive system for visually impaired people · FA26SE013',
  'Khẩn cấp': 'Emergency',
  'Lịch sử di chuyển, đọc chữ, quét mã QR, nhận diện gương mặt, lệnh giọng nói và cảnh báo khẩn cấp.':
    'History of movement, text reading, QR, recognition, voice commands and emergencies.',
  'Loại hoạt động': 'Activity type',
  'Từ ngày': 'From date',
  'Đến ngày': 'To date',
  'Tuyến di chuyển đã ghi nhận': 'Recorded route',
  'Đường nối các vị trí lịch sử, sơ đồ mô phỏng không phải bản đồ đường đi':
    'Lines joining historical locations; a simulated diagram, not a route map',
  'Sơ đồ lịch sử demo; xem tọa độ và giờ ghi nhận trong bảng bên dưới.':
    'Demo history diagram; see coordinates and recorded times in the table below.',
  'Hoạt động đã ghi nhận': 'Recorded activities',
  'Thời gian': 'Time',
  'Nội dung': 'Content',
  'Kết nối': 'Connection',
  'Xác nhận hỗ trợ': 'Acknowledge',
  'Chuyển cấp hỗ trợ': 'Escalate',
  'Đánh dấu đã giải quyết': 'Mark as resolved',
  'Trung tâm cảnh báo': 'Alert center',
  'Ưu tiên phản hồi kịp thời. Mỗi thao tác đều được ghi nhận trong lịch sử.':
    'Respond promptly. Every action is recorded in the history.',
  'Tạo SOS mô phỏng': 'Create simulated SOS',
  'Hộp thư cảnh báo': 'Alert inbox',
  'Trạng thái cảnh báo': 'Alert status',
  'Người cần hỗ trợ': 'Person needing help',
  Loại: 'Type',
  'Xem chi tiết': 'View details',
  'Cảnh báo · {name}': 'Alert · {name}',
  'Không có ảnh chụp sự kiện trong dữ liệu demo.': 'No event snapshot in the demo data.',
  'Chưa được xác nhận sau 5 phút. Cân nhắc liên hệ người thân hoặc hỗ trợ khẩn cấp.':
    'Not acknowledged after 5 minutes. Consider contacting family or emergency services.',
  'Mở trình gọi 115': 'Open dialer for 115',
  'Mở trình gọi không xác nhận cuộc gọi đã diễn ra. Web không tự gọi hoặc tự chuyển trạng thái “Đã gọi”.':
    'Opening the dialer does not confirm the call happened. The Web never calls or sets the “Called” status by itself.',
  'Lịch sử xử lý': 'Handling history',
  'Hệ thống': 'System',
  'Xử lý cảnh báo': 'Handle alert',
  'Xác nhận cập nhật cảnh báo của {name} thành “{p1}”?': 'Update the alert for {name} to “{p1}”?',
  'Bắt đầu': 'Start',
  'Kết thúc': 'End',
  'Chế độ phát hiện': 'Detection mode',
  'Số phát hiện': 'Detections',
  'Số cảnh báo': 'Alerts',
  'Thiết bị': 'Device',
  'Phiên bản ứng dụng': 'App version',
  'Phiên đang hoạt động': 'Active session',
  'Loại đọc chữ': 'Reading type',
  'Cách kích hoạt': 'Trigger',
  'Văn bản gốc': 'Original text',
  'Văn bản đã xử lý': 'Processed text',
  'Độ tin cậy': 'Confidence',
  'Bộ nhận dạng': 'Recognizer',
  'Ngôn ngữ': 'Language',
  'Thời gian xử lý': 'Processing time',
  'Kết quả': 'Result',
  'Thông tin lỗi': 'Error details',
  'Đã phát giọng đọc': 'Voice played',
  'Thời gian yêu cầu': 'Requested at',
  'Vĩ độ': 'Latitude',
  'Kinh độ': 'Longitude',
  'Nội dung QR': 'QR content',
  'Loại QR': 'QR type',
  'Là đường dẫn': 'Is a link',
  'Tên miền trong QR': 'Domain in QR',
  'Thời gian quét': 'Scanned at',
  'Người được nhận diện': 'Recognized person',
  'Độ tương đồng': 'Similarity',
  'Kết quả nhận diện': 'Recognition result',
  'Khoảng cách ước tính': 'Estimated distance',
  'Thời gian nhận diện': 'Recognized at',
  'Lời nói được ghi nhận': 'Recorded speech',
  'Lệnh nhận dạng': 'Recognized command',
  'Kết quả thực hiện': 'Execution result',
  'Yêu cầu xác nhận': 'Requires confirmation',
  'Thời gian xác nhận': 'Confirmed at',
  'Thời lượng âm thanh': 'Audio duration',
  'Xử lý ngoại tuyến': 'Offline processing',
  'Thời gian thực hiện': 'Executed at',
  'Đầy đủ': 'Full',
  'Tối giản': 'Minimal',
  'Thành công': 'Success',
  'Thất bại': 'Failed',
  'Đã thử lại': 'Retried',
  Lỗi: 'Error',
  'Đã xác nhận': 'Confirmed',
  Gần: 'Near',
  'Trung bình': 'Medium',
  'Chưa có': 'None yet',
  Có: 'Yes',
  Không: 'No',
  '{totalCount} kết quả · Trang {page}/{p4}': '{totalCount} results · Page {page}/{p4}',
  'Phát hiện trong phiên': 'Detections in session',
  'Sắp xếp từ cũ đến mới. Đây là nhật ký phát hiện, không phải toàn bộ lộ trình GPS.':
    'Sorted oldest to newest. This is a detection log, not the full GPS route.',
  'Đối tượng': 'Object',
  'Khoảng cách': 'Distance',
  'Đã cảnh báo': 'Alerted',
  'Chưa có phát hiện được lưu trong phiên này.': 'No detections saved in this session.',
  'Lịch sử của {name}': 'History of {name}',
  'Tải lại lịch sử': 'Reload history',
  'Chi tiết': 'Details',
  'Chưa có lịch sử phù hợp với bộ lọc.': 'No history matches the filters.',
  'Lịch sử hoạt động': 'Activity history',
  'Xem các hoạt động đã được ghi nhận của người bạn chăm sóc.':
    'View the recorded activities of the person you care for.',
  'Tìm người được chăm sóc': 'Find a care recipient',
  'Tìm kiếm': 'Search',
  'Tải lại người dùng': 'Reload users',
  'Chọn người được chăm sóc': 'Choose a care recipient',
  '{totalCount} người · Trang {page}/{p4}': '{totalCount} people · Page {page}/{p4}',
  'Chưa có người được chăm sóc phù hợp.': 'No matching care recipients.',
  'Từ thời điểm': 'From',
  'Đến thời điểm': 'To',
  'Tải lại': 'Reload',
  'Chưa có cuộc gọi phù hợp.': 'No matching calls.',
  'Loại cuộc gọi': 'Call type',
  'Thời lượng': 'Duration',
  '{durationSeconds} giây': '{durationSeconds} seconds',
  '{p0} cuộc gọi · Trang {page}/{p4}': '{p0} calls · Page {page}/{p4}',
  'Chi tiết cuộc gọi': 'Call details',
  'Không còn thông tin': 'No longer available',
  'Chấp nhận': 'Accepted',
  'Lý do': 'Reason',
  'Trạng thái chấp nhận do máy chủ ghi nhận không chứng minh âm thanh hoặc hình ảnh đã kết nối.':
    'The accepted status recorded by the server does not prove audio or video was connected.',
  'Chọn người được chăm sóc ở trên để xem danh sách và thêm mới thông tin cho đúng người.':
    'Choose a care recipient above to view the list and add information for the right person.',
  'Danh bạ của {name}': 'Contacts of {name}',
  'Tối đa {max} liên hệ kể cả liên hệ tạm ngưng. Ưu tiên là số nguyên dương và không trùng; số nhỏ hơn được ưu tiên trước.':
    'At most {max} contacts, including paused ones. Priority is a unique positive integer; lower numbers come first.',
  'Thêm liên hệ': 'Add contact',
  'Tải lại liên hệ': 'Reload contacts',
  'Chưa có liên hệ khẩn cấp.': 'No emergency contacts yet.',
  'Danh bạ khẩn cấp': 'Emergency contacts',
  'Liên hệ': 'Contact',
  'Ưu tiên': 'Priority',
  'Tạm ngưng': 'Paused',
  'Thêm liên hệ khẩn cấp': 'Add emergency contact',
  'Sửa liên hệ khẩn cấp': 'Edit emergency contact',
  'Chấp nhận số di động Việt Nam (0… hoặc +84…), hotline 112–115 và tổng đài 1800/1900. Liên kết Zalo được lưu như văn bản, không tự mở.':
    'Accepts Vietnamese mobile numbers (0… or +84…), hotlines 112–115 and 1800/1900 numbers. Zalo links are saved as text and never opened automatically.',
  'Tên liên hệ': 'Contact name',
  'Loại liên hệ': 'Contact type',
  'Bắt buộc với Điện thoại hoặc Điện thoại và Zalo.': 'Required for Phone or Phone and Zalo.',
  'Liên kết Zalo': 'Zalo link',
  'Bắt buộc với Zalo hoặc Điện thoại và Zalo.': 'Required for Zalo or Phone and Zalo.',
  'Thứ tự ưu tiên': 'Priority order',
  'Ghi chú': 'Notes',
  'Đã lưu liên hệ.': 'Contact saved.',
  'Chưa xác nhận được kết quả lưu. Tải lại danh sách trước khi gửi lại để tránh tạo trùng.':
    'The save result was not confirmed. Reload the list before resubmitting to avoid duplicates.',
  'Xóa liên hệ': 'Delete contact',
  'Đổi trạng thái liên hệ': 'Change contact status',
  '{p0} liên hệ {contactName}? Thao tác ảnh hưởng danh bạ khẩn cấp của {name}.':
    '{p0} contact {contactName}? This affects the emergency contacts of {name}.',
  'Đã cập nhật danh bạ.': 'Contacts updated.',
  'Tiếp tục liên kết người được chăm sóc': 'Continue linking the care recipient',
  'Thêm người được chăm sóc': 'Add care recipient',
  'Bước 1/2: Tạo tài khoản': 'Step 1/2: Create account',
  'Bước 2/2: Thiết lập liên kết chăm sóc': 'Step 2/2: Set up the care link',
  'Tạo tài khoản trước, sau đó tạo liên kết chăm sóc. Hai bước được lưu riêng trên hệ thống.':
    'Create the account first, then create the care link. The two steps are saved separately in the system.',
  'Bước 1: Tạo tài khoản người khiếm thị': 'Step 1: Create VIU account',
  '10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.':
    '10 digits, starting with 03, 05, 07, 08 or 09.',
  'Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.':
    'At least 8 characters with uppercase, lowercase, a number and a special character.',
  'Mật khẩu nhập lại không khớp.': 'Passwords do not match.',
  'Nếu liên kết thất bại, thử lại bước này. Không cần tạo thêm tài khoản.':
    'If linking fails, retry this step. No need to create another account.',
  'Bước 2: Tạo liên kết': 'Step 2: Create link',
  'Nhận cảnh báo': 'Receive alerts',
  'Quản lý gương mặt': 'Manage faces',
  'Quản lý địa điểm': 'Manage places',
  'Đã thêm người được chăm sóc.': 'Care recipient added.',
  'Mã người khiếm thị không hợp lệ.': 'The VIU ID must be a valid UUID.',
  'Danh sách người dùng được liên kết với tài khoản của bạn.': 'Users linked to your account.',
  'Tên, email hoặc số điện thoại': 'Name, email or phone number',
  'Không có người dùng phù hợp trong danh sách được phép xem.':
    'No matching users among those you are allowed to view.',
  'Người được chăm sóc trên trang này': 'Care recipients on this page',
  'Chọn người dùng': 'Choose a user',
  'Danh sách người được chăm sóc': 'Care recipient list',
  'Điện thoại': 'Phone',
  'Hết hạn: {p1}': 'Expires: {p1}',
  'Xem liên kết': 'View link',
  'Xem liên kết của ': 'View link of ',
  'Chi tiết người được chăm sóc': 'Care recipient details',
  'Liên kết với {fullName}': 'Link with {fullName}',
  'Gỡ liên kết chăm sóc': 'Remove care link',
  'Gỡ liên kết với ': 'Remove the link with ',
  '? Bạn sẽ mất quyền truy cập qua liên kết này. Tài khoản người dùng không bị xóa.':
    '? You will lose access through this link. The user account is not deleted.',
  'Không còn liên kết hoạt động với người dùng này.':
    'There is no longer an active link with this user.',
  'Chăm sóc chính': 'Primary care',
  'Chăm sóc phụ': 'Secondary care',
  'Gia đình': 'Family',
  'Tổ chức': 'Organization',
  'Gỡ liên kết': 'Remove link',
  'Xem quyền liên kết': 'View link permissions',
  'Liên kết trước': 'Previous links',
  'Liên kết sau': 'Next links',
  'Liên kết đã được gỡ. Hãy tải lại danh sách.':
    'The link has been removed. Please reload the list.',
  'Quyền liên kết': 'Link permissions',
  'Địa điểm và vùng an toàn': 'Places and safe zones',
  'Lưu những nơi người được chăm sóc hay đến và đặt vùng an toàn quanh các nơi đó.':
    'Save frequently visited places and configure circular zones for the care recipient.',
  'Địa điểm của {name}': 'Places of {name}',
  'Loại địa điểm': 'Place type',
  'Địa điểm đã lưu': 'Saved places',
  'Thêm vùng an toàn': 'Add safe zone',
  'Thêm địa điểm': 'Add place',
  'Bạn có quyền xem. Cần quyền quản lý vị trí để thêm, sửa hoặc xóa.':
    'You have view access. Location management permission is needed to add, edit or delete.',
  'Tối đa {max} địa điểm cho mỗi người, bao gồm địa điểm tạm ngưng.':
    'At most {max} places per person, including paused places.',
  'Chưa có địa điểm phù hợp.': 'No matching places.',
  'Danh sách địa điểm': 'Place list',
  bật: 'on',
  tắt: 'off',
  'Vĩ độ: {latitude} · Kinh độ: {longitude}': 'Latitude: {latitude} · Longitude: {longitude}',
  'Bán kính: {p3} m': 'Radius: {p3} m',
  'Xem và sửa': 'View and edit',
  'Trang địa điểm trước': 'Previous places page',
  'Trang địa điểm sau': 'Next places page',
  'Đã lưu.': 'Saved.',
  'Xóa vùng an toàn': 'Delete safe zone',
  'Xóa địa điểm': 'Delete place',
  'Xóa {name}? {p1}': 'Delete {name}? {p1}',
  'Đã xóa.': 'Deleted.',
  'Bán kính (mét)': 'Radius (meters)',
  'Từ 50 đến 50.000 mét.': 'From 50 to 50,000 meters.',
  'Từ 10 đến 5.000 mét.': 'From 10 to 5,000 meters.',
  'Cảnh báo khi ra ngoài': 'Alert on exit',
  'Cảnh báo khi đi vào': 'Alert on enter',
  'Mô tả': 'Description',
  'Lời nhắc khi đến nơi': 'Arrival reminder',
  'Thêm ': 'Add ',
  'Xem và sửa ': 'View and edit ',
  'Chi tiết ': 'Details ',
  'vùng an toàn': 'safe zone',
  'địa điểm': 'place',
  Bật: 'On',
  Tắt: 'Off',
  'Quản lý người thân và ảnh dùng cho nhận diện của người được chăm sóc.':
    'Manage family members and the photos used to recognize them for the care recipient.',
  'Tìm người thân': 'Find a family member',
  'Tải lại danh bạ': 'Reload registry',
  'Thêm người thân': 'Add family member',
  'Bạn có quyền xem. Cần quyền quản lý gương mặt để thêm, sửa hoặc xóa.':
    'You have view access. Face management permission is needed to add, edit or delete.',
  'Chưa có người thân phù hợp.': 'No matching family members.',
  'Danh sách gương mặt thân quen': 'Familiar faces list',
  'Mối quan hệ': 'Relationship',
  '{imageCount} ảnh': '{imageCount} photos',
  'Quản lý ảnh': 'Manage photos',
  '{length} kết quả': '{length} results',
  'Đã lưu người thân.': 'Family member saved.',
  'Xóa người thân': 'Delete family member',
  'Xóa {displayName} khỏi danh bạ và ngừng dùng các ảnh của người này để nhận diện?':
    'Delete {displayName} from the registry and stop using their photos for recognition?',
  'Đã xóa người thân.': 'Family member deleted.',
  'Tên người thân': 'Family member name',
  'Thông tin người thân': 'Family member details',
  'Chưa xác nhận được kết quả lưu. Tải lại danh bạ trước khi gửi lại để tránh tạo trùng.':
    'The save result was not confirmed. Reload the registry before resubmitting to avoid duplicates.',
  'Ảnh người thân': 'Family member photos',
  'Ảnh của {displayName}': 'Photos of {displayName}',
  'Hãy chọn một ảnh.': 'Please choose a photo.',
  'Đã tải ảnh lên.': 'Photo uploaded.',
  'Không thể tải ảnh.': 'Could not upload the photo.',
  ' Tải lại và kiểm tra số ảnh trước khi gửi lại để tránh trùng.':
    ' Reload and check the photo count before resubmitting to avoid duplicates.',
  'Chọn ảnh người thân': 'Choose a family member photo',
  'JPEG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh. Chỉ tải ảnh bạn được phép sử dụng. Ảnh được gửi lên máy chủ để xử lý nhận diện.':
    'JPEG, PNG or WebP, up to 10 MB each. Only upload photos you are allowed to use. Photos are sent to the server for recognition processing.',
  'Đặt ảnh vừa tải làm ảnh chính': 'Set the uploaded photo as primary',
  'Tải ảnh lên': 'Upload photo',
  'Bạn có quyền xem ảnh, chưa có quyền quản lý gương mặt.':
    'You can view photos but do not have face management permission.',
  'Tải lại ảnh': 'Reload photos',
  'Chưa có ảnh. Thêm ít nhất {min} ảnh để kích hoạt.':
    'No photos yet. Add at least {min} photos to activate.',
  'Ảnh {p0}': 'Photo {p0}',
  '{displayName}, ảnh {p1}': '{displayName}, photo {p1}',
  'Ảnh chính': 'Primary photo',
  'Đặt ảnh chính': 'Set as primary',
  'Đã đổi ảnh chính.': 'Primary photo changed.',
  'Không thể đổi ảnh chính.': 'Could not change the primary photo.',
  'Xóa ảnh': 'Delete photo',
  'Xóa ảnh người thân': 'Delete family member photo',
  'Xóa vĩnh viễn ảnh này? Nếu còn dưới {min} ảnh, người thân sẽ ngừng hoạt động trong nhận diện.':
    'Permanently delete this photo? With fewer than {min} photos, the family member will stop being used for recognition.',
  'Đã xóa ảnh.': 'Photo deleted.',
  'Không tải được ảnh.': 'Could not load the photo.',
  'Thử tải ảnh lại': 'Try loading the photo again',
  'Ảnh không thể hiển thị.': 'The photo cannot be displayed.',
  'Đang tải ảnh…': 'Loading photo…',
  'Giọng đọc': 'Voice',
  Nữ: 'Female',
  'Tốc độ đọc': 'Reading speed',
  'Âm lượng': 'Volume',
  'Từ 0 đến 100%. Mức 0 sẽ tắt âm thanh giọng đọc.': 'From 0 to 100%. Level 0 mutes the voice.',
  'Ngôn ngữ chính': 'Primary language',
  'Ngôn ngữ phụ': 'Secondary language',
  'Giọng đọc của {name}': 'Voice of {name}',
  'Không dùng': 'Not used',
  'Chưa có cấu hình giọng đọc. Bạn có thể tạo cấu hình cho người được chọn.':
    'No voice configuration yet. You can create one for the selected person.',
  'Tải lại cấu hình': 'Reload configuration',
  'Chỉnh sửa giọng đọc': 'Edit voice',
  'Tạo cấu hình giọng đọc': 'Create voice configuration',
  'Đã lưu cấu hình. Hãy kiểm tra lại trên điện thoại.': 'Settings saved. Check them on the phone.',
  'Chưa xác nhận được kết quả lưu. Đóng hộp thoại và tải lại cấu hình trước khi gửi lại.':
    'The save result was not confirmed. Close the popup and reload the configuration before resubmitting.',
  'Chọn người được chăm sóc ở trên để xem và chỉnh cấu hình giọng đọc.':
    'Choose a care recipient above to view and edit the voice configuration.',
  'Tối đa 5 liên hệ. Số ưu tiên nhỏ hơn được ưu tiên trước; không được trùng.':
    'At most 5 contacts. Lower priority numbers come first; they must be unique.',
  'Điện thoại và Zalo': 'Phone and Zalo',
  'Bắt buộc khi liên hệ qua điện thoại. Để trống nếu chỉ dùng Zalo.':
    'Required when contacting by phone. Leave empty if only Zalo is used.',
  'Định danh Zalo': 'Zalo ID',
  'Bắt buộc khi liên hệ qua Zalo. Để trống nếu chỉ dùng điện thoại.':
    'Required when contacting via Zalo. Leave empty if only phone is used.',
  'Ưu tiên {p1}': 'Priority {p1}',
  'Nhập mã liên kết': 'Enter link code',
  'Đang liên kết': 'Linked',
  'Đã ngừng hoạt động': 'Deactivated',
  'Chưa có số điện thoại': 'No phone number',
  'Theo dõi': 'Track',
  'Tạo mã QR demo': 'Create demo QR code',
  'Danh sách liên kết': 'Link list',
  'Phạm vi': 'Scope',
  'Trung tâm': 'Center',
  'Vai trò của bạn': 'Your role',
  'Nhập mã liên kết demo': 'Enter demo link code',
  'Đọc mã từ ảnh QR · JPG/PNG dưới 5 MB': 'Read the code from a QR image · JPG/PNG under 5 MB',
  'Đang đọc mã…': 'Reading code…',
  'Mã VA-DEMO từ người chăm sóc chính': 'VA-DEMO code from the primary caregiver',
  'Mời người chăm sóc phụ': 'Invite a secondary caregiver',
  'Mã liên kết demo': 'Demo link code',
  'Mã dùng một lần, hết hạn sau 10 phút. Đăng nhập tài khoản người chăm sóc khác trên trình duyệt này rồi nhập mã. Đây là bản demo, chưa phải mã QR thật.':
    'Single-use code that expires after 10 minutes. Sign in with another Caregiver account in this browser and enter the code. This is a demo flow, not production QR.',
  'Bán kính (m)': 'Radius (m)',
  'Địa điểm quen thuộc': 'Familiar places',
  'Vùng tròn, cảnh báo khi đi vào hoặc ra ngoài. Sơ đồ chỉ là bản xem trước mô phỏng.':
    'Circular zones that alert on enter or exit. The diagram is only a simulated preview.',
  'Lưu nơi thường đến và lời nhắc khi đến nơi. Bán kính mặc định 50 m.':
    'Save frequently visited places and arrival reminders. Default radius 50 m.',
  'Cảnh báo khi đi ra': 'Alert on exit',
  '· Vào: {p0} · Ra: {p1}': '· Enter: {p0} · Exit: {p1}',
  'Chọn kênh nhận tin phù hợp; các thông báo bắt buộc luôn được giữ lại.':
    'Choose suitable channels; mandatory notifications are always kept.',
  'Xin quyền thông báo trình duyệt': 'Request browser notification permission',
  'Email và thông báo trong bản demo chỉ là mô phỏng, chưa gửi thật.':
    'Email and push are only simulated in this version. No real FCM sending or registration.',
  'Thông báo đẩy': 'Push notifications',
  'Danh bạ nhận diện người thân. Cần ít nhất 3 ảnh để kích hoạt mỗi người.':
    'Family face registry. Each person needs at least 3 photos to be activated.',
  '{p0} · {p4} ảnh': '{p0} · {p4} photos',
  'Ảnh của ': 'Photos of ',
  'Đủ ảnh để nhận diện': 'Enough photos for recognition',
  'Cần ít nhất 3 ảnh': 'Needs at least 3 photos',
  'Chỉ dùng ảnh thử nghiệm. Bản demo lưu ảnh ngay trên trình duyệt; việc mã hóa và xóa ảnh do máy chủ thực hiện, bản demo không làm. Giới hạn demo 2 MB/ảnh.':
    'Use test photos only. The demo stores photos locally; AES-256 encryption and MinIO deletion belong to the backend and are not performed here. Demo limit 2 MB/photo.',
  'Thêm nhiều ảnh JPG/PNG': 'Add several JPG/PNG photos',
  'Chỉ nhận JPG/PNG dưới 2 MB.': 'Only JPG/PNG under 2 MB.',
  'Không đọc được ảnh.': 'Could not read the photo.',
  'Đang lưu ảnh…': 'Saving photo…',
  'Ảnh đã đăng ký của ': 'Registered photos of ',
  'Ảnh bổ sung': 'Additional photo',
  'Chưa có ảnh. Thêm ảnh từ thiết bị để thử luồng đăng ký.':
    'No photos yet. Add photos from your device to try the registration flow.',
  'Xóa ảnh đã chọn?': 'Delete the selected photo?',
  'Xóa ảnh có thể khiến người này không còn đủ 3 ảnh để nhận diện.':
    'Deleting the photo may leave this person with fewer than the 3 photos needed for recognition.',
  'Cấu hình từ xa cho người được chăm sóc. Demo chỉ lưu tùy chọn, chưa đồng bộ xuống điện thoại.':
    'Remote configuration for the care recipient. The demo only stores preferences and does not sync to the Mobile device.',
  'Tốc độ đọc (0.5–2 lần)': 'Reading speed (0.5–2×)',
  'Âm lượng (0–100)': 'Volume (0–100)',
  'Tài khoản cần thuộc một trung tâm để xem báo cáo.':
    'The account must belong to a center to view reports.',
  'Tổng hợp hoạt động của người khiếm thị thuộc trung tâm và tra cứu thành viên.':
    'Activity summary of visually impaired members of the center and member lookup.',
  'Hoạt động của trung tâm': 'Center activity',
  'Xem báo cáo': 'View report',
  'Tải lại báo cáo': 'Reload report',
  'Sự kiện khẩn cấp': 'Emergency events',
  'Sự kiện ranh giới vùng an toàn': 'Safe zone boundary events',
  'Yêu cầu đọc chữ và quét QR': 'Text reading and QR scan requests',
  'Lượt nhận diện gương mặt': 'Face recognitions',
  'Thành viên hiện tại': 'Current members',
  'Tìm thành viên': 'Find a member',
  'Lọc thành viên': 'Filter members',
  'Tải lại thành viên': 'Reload members',
  'Bảng thành viên': 'Member table',
  'Họ tên': 'Full name',
  'Chưa có thành viên phù hợp.': 'No matching members.',
  '{totalCount} thành viên · Trang {page}/{p4}': '{totalCount} members · Page {page}/{p4}',
  'Địa chỉ': 'Address',
  'Điện thoại liên hệ': 'Contact phone',
  'Email liên hệ': 'Contact email',
  'Mã số thuế / giấy phép': 'Tax code / license',
  'Hồ sơ trung tâm': 'Center profile',
  'Thông tin liên hệ và địa chỉ của tổ chức bạn đang quản lý.':
    'Contact details and address of the organization you manage.',
  'Cảnh báo và thời gian phản hồi của nhân viên trong trung tâm. Không gồm nhật ký thao tác của toàn hệ thống.':
    'Alerts and staff response times in the center. Does not include the system-wide audit.',
  'Số sự kiện': 'Events',
  'Phản hồi trung bình': 'Average response',
  ' phút': ' min',
  'Chưa có dữ liệu': 'No data yet',
  'Nhật ký hỗ trợ của trung tâm': 'Center support log',
  'Sự kiện': 'Event',
  'Nhân viên / phản hồi': 'Staff / response',
  'Nhân viên': 'Staff',
  '{p0} phút': '{p0} min',
  'Chưa phản hồi': 'No response yet',
  'Người dùng của trung tâm': 'Center users',
  'Theo dõi vị trí được chia sẻ, lưu địa điểm quen thuộc và nhận biết khi người thân ra khỏi vùng an toàn.':
    'Follow shared locations, save familiar places and know when a loved one leaves a safe zone.',
  'Tiếp nhận cảnh báo khẩn cấp, phối hợp hỗ trợ và theo dõi lịch sử xử lý trong một không gian chung.':
    'Receive emergency alerts, coordinate support and follow the handling history in one shared space.',
  'Ứng dụng di động được thiết kế để hỗ trợ nhận biết vật thể, đọc văn bản và nhận diện gương mặt quen thuộc. Khả năng hoạt động còn phụ thuộc thiết bị và điều kiện sử dụng.':
    'The mobile app is designed to help recognize objects, read text and identify familiar faces. How well it works still depends on the device and conditions of use.',
  'Điều hướng trang chủ': 'Home page navigation',
  'Tính năng': 'Features',
  'Cách hoạt động': 'How it works',
  'Gói & mô hình': 'Plans & models',
  'Đóng menu': 'Close menu',
  'Mở menu': 'Open menu',
  'Dành cho gia đình và các trung tâm chăm sóc': 'For families and care centers',
  'VisionAid đang trong giai đoạn kiểm thử liên thông. AI dẫn đường, cuộc gọi và thông báo cần được xác minh cùng ứng dụng di động trước khi sử dụng thực tế; trang này không cam kết mọi tính năng đã sẵn sàng trên mọi thiết bị.':
    'VisionAid is in integration testing. Hybrid AI, calls and notifications must be verified with the mobile app before real-world use; this page does not promise every feature is ready on every device.',
  'Nhận biết trên thiết bị. Kết nối khi cần.': 'Recognition on the device. Connection when needed.',
  'AI của VisionAid kết hợp xử lý trên điện thoại và máy chủ. Web là nơi người chăm sóc theo dõi và phối hợp hỗ trợ, không phải công cụ chỉ đường trực tiếp.':
    'Hybrid AI combines processing on the phone and on the server. The Web is where caregivers monitor and coordinate support, not a live navigation tool.',
  'Vật thể ở gần': 'Nearby objects',
  'Theo thiết kế, điện thoại xử lý cảnh báo gần bằng YOLOv8n ngay trên thiết bị, để không phụ thuộc phản hồi từ máy chủ cho phần này.':
    'By design, the phone handles near-range warnings with YOLOv8n on the device, so this part does not depend on a server response.',
  'Vật thể ở khoảng cách trung bình và xa': 'Objects at medium and long range',
  'Khi có kết nối và tính năng được bật, dữ liệu nhận biết được gửi đến máy chủ để xử lý hướng dẫn. Chất lượng camera, mạng và cấu hình có thể ảnh hưởng kết quả.':
    'When connected and the feature is enabled, recognition data is sent to the server to produce guidance. Camera quality, network and configuration may affect the results.',
  'Trao đổi với người chăm sóc': 'Talking with caregivers',
  'Luồng gọi âm thanh/video giúp hai bên phối hợp khi được cấp quyền và thiết bị hỗ trợ. Cần cho phép micro hoặc camera khi bắt đầu; đây không phải dịch vụ cứu hộ.':
    'Audio/video calls help both sides coordinate when permission is granted and the device supports it. The microphone or camera must be allowed when starting; this is not a rescue service.',
  'Ứng dụng di động dành cho người khiếm thị. Không gian Web dành cho những người đồng hành.':
    'The mobile app is for visually impaired people. The Web workspace is for those who support them.',
  'Vào không gian chăm sóc': 'Enter the care workspace',
  'Tạo tài khoản người chăm sóc': 'Create a caregiver account',
  'Đăng ký cho gia đình hoặc đăng nhập bằng tài khoản được trung tâm cấp.':
    'Sign up as a family or sign in with an account issued by your center.',
  'Liên kết với người thân': 'Link with your loved one',
  'Kết nối với người khiếm thị và thiết lập quyền chăm sóc phù hợp.':
    'Connect with the visually impaired person and set up suitable care permissions.',
  'Đồng hành mỗi ngày': 'Support every day',
  'Theo dõi thông tin được chia sẻ, quản lý địa điểm và phối hợp khi có cảnh báo.':
    'Follow shared information, manage places and coordinate when alerts happen.',
  'Gia đình sử dụng Personal; trung tâm sử dụng Business. Đăng nhập để xem gói, giá và quyền lợi hiện được cung cấp cho tài khoản của bạn.':
    'Families use Personal; centers use Business. Sign in to see the plans, prices and benefits currently offered to your account.',
  'Personal · Gia đình': 'Personal · Family',
  'Người chăm sóc quản lý người thân được liên kết, thông tin hỗ trợ và quyền sử dụng dành cho gia đình. Tạo tài khoản người chăm sóc để bắt đầu.':
    'Caregivers manage linked loved ones, support information and family usage rights. Create a caregiver account to get started.',
  'Business · Trung tâm': 'Business · Center',
  'Trung tâm quản lý kho suất sử dụng, phân công nhân viên và theo dõi người được chăm sóc trong tổ chức. Nhân viên dùng tài khoản do trung tâm cấp.':
    'Centers manage the license pool, assign staff and follow care recipients in the organization. Staff use accounts issued by the center.',
  'Người dùng độc lập · Trung tâm đồng hành': 'Standalone · Center-supported',
  'Người khiếm thị thuộc tổ chức được nhân viên chăm sóc hỗ trợ qua ứng dụng di động và danh bạ khẩn cấp. Đây là mô hình sử dụng trong tổ chức, không phải một vai trò tài khoản hoặc gói mua riêng.':
    'Visually impaired members of an organization are supported by care staff through the mobile app and emergency contacts. This is an in-organization usage model, not an account role or a separately purchased plan.',
  'Đăng nhập để xem gói': 'Sign in to see plans',
  'Chuẩn bị trước mỗi hành trình.': 'Prepare before every journey.',
  'VisionAid là công cụ hỗ trợ. Tiếp tục sử dụng gậy trắng và thiết bị hỗ trợ phù hợp; không dựa hoàn toàn vào camera hoặc một cảnh báo trên ứng dụng để di chuyển.':
    'VisionAid is an assistive tool. Keep using a white cane and suitable assistive devices; do not rely entirely on the camera or a single app alert to move around.',
  'Cố định điện thoại bằng dây đeo ngực để camera hướng về phía trước khi dùng chức năng nhận biết trên hành trình.':
    'Secure the phone with a chest strap so the camera faces forward when using recognition on the move.',
  'Bắt buộc dùng đai đeo ngực.': 'A chest strap is required.',
  'Thiếu sáng, mưa hoặc ống kính bị che có thể làm giảm khả năng nhận biết. Không coi việc không có cảnh báo là đường đi an toàn.':
    'Low light, rain or a covered lens can reduce recognition. Do not treat the absence of an alert as a safe path.',
  'Camera có điểm mù.': 'The camera has blind spots.',
  'Chuẩn bị pin, quyền truy cập cần thiết và danh bạ khẩn cấp; tính năng dùng máy chủ hoặc gọi cần kết nối phù hợp.':
    'Prepare the battery, required permissions and emergency contacts; server features and calls need a suitable connection.',
  'Kiểm tra thiết bị và liên hệ hỗ trợ.': 'Check the device and contact support.',
  'VisionAid · Trang chủ': 'VisionAid · Home',
  'VisionAid · Dự án FA26SE013': 'VisionAid · Project FA26SE013',
  'Bản trải nghiệm sử dụng dữ liệu mô phỏng.': 'Experience build using simulated data.',
  'Bản thử nghiệm · Các tính năng liên thông đang được kiểm thử.':
    'Trial build · Integrated features are being tested.',
  'Để trống hoặc nhập số Việt Nam có 10 chữ số.':
    'Leave empty or enter a 10-digit Vietnamese number.',
  'Ít nhất 8 ký tự, có chữ hoa/thường, số và ký tự đặc biệt.':
    'At least 8 characters with upper/lowercase letters, a number and a special character.',
  'Tìm tài khoản': 'Find account',
  'Tên, email, điện thoại': 'Name, email, phone',
  'Đã xóa': 'Deleted',
  'Không có tài khoản phù hợp.': 'No matching accounts.',
  'Xem tài khoản ': 'View account ',
  'Chi tiết tài khoản': 'Account details',
  'Sửa hồ sơ tài khoản': 'Edit account profile',
  'Email, vai trò và tổ chức giữ nguyên: {email} · {p3}':
    'Email, role and organization stay unchanged: {email} · {p3}',
  'Tổ chức: {p1} · Vai trò: {p3}': 'Organization: {p1} · Role: {p3}',
  'Nhân viên không tính vào số suất. Để tạo người được chăm sóc, tổ chức cần gói dịch vụ đang hoạt động và còn suất. Nếu không cấp được suất, tài khoản sẽ không được tạo.':
    'Staff do not use license seats. To create a care recipient, the organization needs an active license plan with free seats. If no seat can be assigned, the account is not created.',
  'Lưu hồ sơ': 'Save profile',
  '{p0} Kiểm tra dữ liệu và kho suất sử dụng; nếu hết suất, mua thêm gói Business rồi thử lại.':
    '{p0} Check the data and the license pool; if seats are exhausted, buy another Business plan and try again.',
  'Chưa xác nhận được kết quả lưu. Đóng hộp thoại và tải lại hoặc tìm theo email trước khi gửi lại để tránh tạo trùng tài khoản.':
    'The save result was not confirmed. Close the form and reload/search the email before resubmitting to avoid duplicate accounts.',
  'Chưa có điện thoại': 'No phone yet',
  'Không thuộc tổ chức': 'No organization',
  'Quản lý cấp và thu hồi': 'Manage assignment and revocation',
  'Vô hiệu hóa tài khoản': 'Deactivate account',
  'Kích hoạt tài khoản': 'Activate account',
  'Xóa tài khoản': 'Delete account',
  'Đã cập nhật hồ sơ.': 'Profile updated.',
  'Đã cập nhật trạng thái.': 'Status updated.',
  'Tài khoản: {email}. Đặt lại mật khẩu sẽ đăng xuất người dùng khỏi mọi thiết bị; họ cần đăng nhập lại.':
    'Account: {email}. Resetting the password revokes refresh sessions; the user must sign in again.',
  'Xác nhận đặt lại mật khẩu': 'Confirm password reset',
  'Đã đặt lại mật khẩu; người dùng cần đăng nhập lại.':
    'Password reset; the user must sign in again.',
  'Cử chỉ': 'Gesture',
  'Từ thời gian': 'From time',
  'Đến thời gian': 'To time',
  'Lọc cảnh báo': 'Filter alerts',
  'Tải lại cảnh báo': 'Reload alerts',
  'Không có cảnh báo phù hợp.': 'No matching alerts.',
  'Danh sách cảnh báo': 'Alert list',
  'Phát hiện': 'Detected',
  '{totalCount} cảnh báo · Trang {page}/{p4}': '{totalCount} alerts · Page {page}/{p4}',
  'Chi tiết cảnh báo': 'Alert details',
  'Vị trí ghi nhận': 'Recorded location',
  'Vĩ độ:': 'Latitude:',
  '· Kinh độ:': '· Longitude:',
  'Không có dữ liệu': 'No data',
  'Không có': 'None',
  'Không có ảnh chụp sự kiện.': 'No event snapshot.',
  'Ảnh hiện trường': 'Scene photo',
  'Sự kiện này có ảnh hiện trường. Ảnh sẽ xem được tại đây khi máy chủ mở chức năng tải ảnh.':
    'This event has a scene photo. It will be viewable here once the server enables photo downloads.',
  'Ảnh hiện trường lúc phát hiện cảnh báo': 'Scene photo taken when the alert was detected',
  'Mở ảnh cỡ lớn': 'Open full-size photo',
  'Máy chủ chưa hỗ trợ tải ảnh hiện trường.':
    'The server does not support scene photo downloads yet.',
  'Đang kiểm tra quyền xem ảnh…': 'Checking photo access…',
  'Chỉ người có quyền nhận và xử lý cảnh báo mới xem được ảnh hiện trường.':
    'Only caregivers allowed to receive and handle this alert can view the scene photo.',
  'Ảnh hiện trường không còn trên máy chủ (có thể đã hết hạn lưu trữ).':
    'The scene photo is no longer on the server (its retention period may have ended).',
  'Ghi chú xử lý': 'Handling notes',
  'Bạn có quyền xem nhưng không có quyền xử lý cảnh báo.': 'You can view but cannot handle alerts.',
  'Chuyển cấp không có nghĩa cuộc gọi đã diễn ra. Web không tự gọi hoặc mở Zalo.':
    'Escalating does not mean a call has taken place. The Web never calls or opens Zalo by itself.',
  'Không có số điện thoại': 'No phone number',
  'Chưa có lịch sử xử lý.': 'No handling history yet.',
  'Máy chủ đã xác nhận cập nhật.': 'The server confirmed the update.',
  'Không thể xử lý.': 'Could not process.',
  ' Chưa xác nhận thành công; kiểm tra trạng thái mới trước khi thử lại.':
    ' Not confirmed as successful; check the new status before retrying.',
  'Chưa có thời hạn từ máy chủ': 'No expiry from the server yet',
  'Trạng thái và thời hạn sử dụng của tài khoản.': 'Status and validity period of the account.',
  'Tải lại thông tin gói dịch vụ': 'Reload license information',
  'Thông tin gói dịch vụ': 'License information',
  'Xem danh mục gói': 'View plan catalog',
  'Thời hạn hồ sơ: {p1}': 'Profile validity: {p1}',
  'Gói sử dụng cá nhân': 'Personal usage plan',
  'Máy chủ chưa tìm thấy thông tin gói sử dụng cho tài khoản này.':
    'The server has not found usage plan information for this account.',
  Gói: 'Plan',
  'Trạng thái gói': 'Plan status',
  'Hết hạn kỳ sử dụng': 'Period expires',
  'Dùng thử và gói Personal hỗ trợ tối đa {max} người được chăm sóc. Quyền truy cập từng người vẫn theo liên kết.':
    'Trial and Personal support up to {max} care recipients. Access to each person still follows the link.',
  'Xem kho suất sử dụng của tổ chức': 'View the organization license pool',
  'Chỉ quản trị trung tâm có tổ chức được xem kho suất sử dụng.':
    'Only center administrators with an organization can view the license pool.',
  'Kho suất sử dụng của tổ chức': 'Organization license pool',
  'Tải lại kho suất sử dụng': 'Reload license pool',
  'Chọn gói Business': 'Choose a Business plan',
  'Tổ chức chưa có kho suất sử dụng. Chọn gói Business để bắt đầu.':
    'The organization has no license pool yet. Choose a Business plan to get started.',
  'Tổng số suất': 'Total licenses',
  'Đã sử dụng': 'Used',
  'Còn lại': 'Remaining',
  'Ngày mua': 'Purchase date',
  'Hết hạn': 'Expires',
  'Không có thời hạn từ máy chủ': 'No expiry from the server',
  'Nhân viên chăm sóc không sử dụng suất trong kho. Việc cấp suất sử dụng cho người được chăm sóc do máy chủ kiểm tra.':
    'Care staff do not use licenses from the pool. Assigning licenses to care recipients is checked by the server.',
  'Lịch sử thanh toán': 'Payment history',
  'Tạo liên kết': 'Create link',
  'Loại liên kết': 'Link type',
  'Tất cả loại': 'All types',
  'Trạng thái liên kết': 'Link status',
  'Đã gỡ': 'Removed',
  'Lọc liên kết': 'Filter links',
  'Không có liên kết phù hợp.': 'No matching links.',
  'Danh sách liên kết chăm sóc': 'Care link list',
  'Thông tin liên kết': 'Link information',
  'Đã gỡ liên kết. Nếu đó là người chăm sóc chính, người chăm sóc lâu nhất còn lại sẽ tự trở thành người chính.':
    'Link removed. If it was the primary caregiver, the longest-serving remaining caregiver becomes primary.',
  'Trung tâm chưa có nhân viên đang hoạt động. Tạo nhân viên trước.':
    'The center has no active staff yet. Create staff first.',
  'Trung tâm chưa có người được chăm sóc đang hoạt động. Tạo tài khoản người khiếm thị trước.':
    'The center has no active care recipients yet. Create a VIU account first.',
  'Sửa quyền liên kết': 'Edit link permissions',
  'Chỉ chọn được người bạn đang chăm sóc chính. Người được thêm là người chăm sóc phụ với các quyền bạn chọn bên dưới.':
    'Only people you are the primary caregiver for can be chosen. The added person becomes a secondary caregiver with the permissions selected below.',
  'Thêm người chăm sóc phụ': 'Add secondary caregiver',
  'Email người chăm sóc phụ': 'Secondary caregiver email',
  'Nhập đúng email tài khoản người chăm sóc gia đình của người được mời. Họ cần đăng ký tài khoản trước.':
    'Enter the exact email of the invited person’s personal Caregiver account. They must register first.',
  'Chỉ người chăm sóc chính mới thêm được người chăm sóc khác.':
    'Only the primary caregiver can add another caregiver.',
  'Không tìm thấy tài khoản người chăm sóc với email này.':
    'No caregiver account was found with this email.',
  'Tài khoản này thuộc một trung tâm nên không thể thêm làm người chăm sóc cá nhân.':
    'This account belongs to a center and cannot be added as a personal caregiver.',
  'Bạn chỉ tự liên kết được với tài khoản do bạn tạo và chưa có người chăm sóc. Hãy nhờ người chăm sóc chính thêm bạn.':
    'You can only link yourself to an account you created that has no caregiver yet. Ask the primary caregiver to add you.',
  'Người được chăm sóc thuộc trung tâm; liên kết do quản trị trung tâm quản lý.':
    'This care recipient belongs to a center; their links are managed by the center admin.',
  'Tài khoản thuộc trung tâm không mua gói cá nhân; gói dịch vụ do trung tâm cấp.':
    'Center accounts cannot buy a personal plan; the license is provided by the center.',
  'Đang tải danh sách nhân viên và người được chăm sóc…': 'Loading staff and care recipients…',
  'Lưu quyền liên kết': 'Save link permissions',
  'Chi tiết liên kết': 'Link details',
  'Chuyển thành chăm sóc chính': 'Make primary caregiver',
  'Liên kết này chỉ được xem trong tài khoản hiện tại.':
    'This link can only be viewed in the current account.',
  'Đã lưu quyền liên kết.': 'Link permissions saved.',
  'Chuyển người chăm sóc chính': 'Transfer primary caregiver',
  'Đã chuyển người chăm sóc chính.': 'Primary caregiver transferred.',
  'Loại thông báo': 'Notification type',
  'Kênh thông báo': 'Notification channel',
  'Bắt buộc nhận': 'Mandatory',
  'Đang áp dụng': 'Applied',
  'Toàn hệ thống': 'System-wide',
  'Tài khoản cần thuộc một trung tâm để quản lý quy tắc.':
    'The account must belong to a center to manage rules.',
  'Chọn loại thông báo bạn muốn nhận và cách nhận (ứng dụng, email, trên web).':
    'Settings by type and channel for your account.',
  'Quy định ai nhận thông báo nào: quy định chung của hệ thống và quy định riêng của trung tâm.':
    "System-wide rules and the center's own rules.",
  'Thiết lập tùy chọn': 'Set a preference',
  'Thêm quy tắc': 'Add rule',
  'Các tùy chọn ở đây chỉ chọn loại thông báo muốn nhận; chúng không tự bật thông báo trên trình duyệt này. Muốn nhận thông báo ngay trên máy, vào Hồ sơ và chọn Bật thông báo trình duyệt.':
    'Saving the Push preference does not enable notifications in this browser. To receive push, go to Profile and choose Enable browser notifications.',
  'Ngừng áp dụng': 'Not applied',
  'Chưa lưu tùy chọn nào. Máy chủ áp dụng quy tắc mặc định.':
    'No preferences saved yet. The server applies the default rules.',
  Kênh: 'Channel',
  'Tùy chọn đã lưu': 'Saved preference',
  'Tắt nếu không bắt buộc': 'Off if not mandatory',
  'Không có quy tắc phù hợp.': 'No matching rules.',
  'Loại / Kênh': 'Type / Channel',
  'Người nhận': 'Recipient',
  'Riêng trung tâm': 'Center-specific',
  'Theo tùy chọn': 'By preference',
  'Lưu tùy chọn': 'Save preference',
  'Sửa quy tắc': 'Edit rule',
  'Bật nhận khi không bắt buộc': 'Receive when not mandatory',
  'Vai trò nhận': 'Recipient role',
  'Xóa quy tắc thông báo?': 'Delete notification rule?',
  '. Việc gửi thông báo có thể thay đổi sau khi xóa; quy tắc toàn hệ thống có thể được áp dụng lại.':
    '. Notification delivery may change after deletion; the system-wide rule may apply again.',
  'Đã xóa quy tắc thông báo.': 'Notification rule deleted.',
  'Tên tổ chức': 'Organization name',
  'Để trống, hoặc nhập số di động, số bàn 02x hay tổng đài 1800/1900.':
    'Leave empty, or enter a mobile number, a 02x landline or a 1800/1900 number.',
  'Tạo tổ chức': 'Create organization',
  'Đã tạo tổ chức. Tiếp theo, tạo tài khoản Quản trị trung tâm tại Quản lý tài khoản.':
    'Organization created. Next, create a Center Admin account in Account management.',
  'Tìm tổ chức': 'Find organization',
  'Tên, mã số thuế, email': 'Name, tax code, email',
  'Không có tổ chức phù hợp.': 'No matching organizations.',
  'Xem tổ chức ': 'View organization ',
  'Chi tiết tổ chức': 'Organization details',
  'Đã xóa tổ chức. Muốn xem lại: mở Bộ lọc, ở ô Tổ chức đã xóa chọn "Chỉ hiện tổ chức đã xóa".':
    'Organisation deleted. To see it again: open Filters and set Deleted organisations to "Only deleted organisations".',
  'Sửa tổ chức': 'Edit organization',
  'Lưu tổ chức': 'Save organization',
  'Lỗi máy chủ.': 'Server error.',
  ' Có thể thay đổi đã được lưu; đóng hộp thoại và tải lại danh sách để kiểm tra trước khi gửi lại.':
    ' The change may have been saved; close the form and reload the list to check before resubmitting.',
  'Chưa có email': 'No email yet',
  'Vô hiệu hóa tổ chức': 'Deactivate organization',
  'Kích hoạt tổ chức': 'Activate organization',
  'Xóa tổ chức': 'Delete organization',
  'Đã cập nhật tổ chức.': 'Organization updated.',
  ': khôi phục tổ chức; thành viên vẫn cần được kích hoạt riêng.':
    ': restores the organization; members still need to be activated individually.',
  ': thành viên đang hoạt động sẽ bị vô hiệu hóa và đăng xuất khỏi mọi thiết bị.':
    ': active members will be deactivated and their sessions/FCM revoked.',
  ' Tổ chức sẽ chuyển sang danh sách đã xóa.': ' The organisation moves to the deleted list.',
  'Đã kích hoạt tổ chức; cần kích hoạt từng thành viên riêng.':
    'Organization activated; each member must be activated individually.',
  'Đã vô hiệu hóa tổ chức.': 'Organization deactivated.',
  'Thành viên tổ chức': 'Organization members',
  'Trạng thái thành viên': 'Member status',
  'Tên gói': 'Plan name',
  'Giá tháng': 'Monthly price',
  'Giá năm': 'Yearly price',
  'Đơn vị tiền tệ': 'Currency',
  'Số người khiếm thị trên mỗi suất': 'VIUs per license (plan configuration)',
  'Số người khiếm thị của gói gia đình vẫn theo cấu hình hệ thống; ô này không thay đổi giới hạn đó.':
    'The B2C VIU count still follows the caregiving.max_vius_per_caregiver setting; this field does not change that limit.',
  'Số suất sử dụng đi kèm': 'Included licenses',
  'Số ngày dùng thử': 'Trial days',
  'Thời hạn gói (ngày)': 'Plan duration (days)',
  'Tài khoản này không cần chọn gói cá nhân. Gói dịch vụ do tổ chức quản lý.':
    'This account does not need a personal plan. Licenses are managed by the organization.',
  'Quản lý gói dịch vụ': 'License plan management',
  'Danh mục gói': 'Plan catalog',
  'Chọn gói Personal dành cho gia đình và thanh toán qua PayOS.':
    'Choose a Personal plan and create a PayOS payment order.',
  'Chọn gói Business dành cho trung tâm và thanh toán qua PayOS.':
    'Choose a Business plan and create a PayOS payment order.',
  'Thêm gói': 'Add plan',
  'Đang mở': 'Open',
  'Ngừng mở': 'Closed',
  'Tải lại danh mục': 'Reload catalog',
  'Danh sách gói dịch vụ': 'License plan list',
  'Thời hạn': 'Duration',
  'Giá năm tham khảo: {p1}': 'Reference yearly price: {p1}',
  '{durationDays} ngày': '{durationDays} days',
  'Dùng thử: {trialDays} ngày': 'Trial: {trialDays} days',
  'Tối đa {max} người khiếm thị theo chính sách gói gia đình':
    'At most {max} VIUs under the B2C policy',
  '{includedLicenses} suất sử dụng đi kèm': '{includedLicenses} licenses included',
  'Chọn gói {name}': 'Choose plan {name}',
  'Gói chưa hỗ trợ thanh toán trực tuyến.': 'This plan does not support online payment yet.',
  'Chi tiết / Sửa': 'Details / Edit',
  'Chưa có gói phù hợp trên trang này.': 'No suitable plans on this page.',
  ' Hãy xem trang tiếp theo.': ' See the next page.',
  'Đã lưu gói dịch vụ.': 'Package saved.',
  'Mã gói': 'Plan code',
  'Chữ in hoa, số, dấu gạch dưới. Không thể đổi sau khi tạo.':
    'Uppercase letters, digits and underscores. Cannot be changed after creation.',
  'Loại gói': 'Plan type',
  'Đang mở bán': 'On sale',
  'Thêm gói dịch vụ': 'Add license plan',
  'Chi tiết / Sửa gói': 'Plan details / Edit',
  'Mã: {code} · Loại: {packageType} · không thể thay đổi':
    'Code: {code} · Type: {packageType} · cannot be changed',
  'Tạo gói': 'Create plan',
  'Lưu gói': 'Save plan',
  'Thanh toán gói Business': 'Pay for Business plan',
  'Thanh toán gói Personal': 'Pay for Personal plan',
  'Gói đã chọn': 'Selected plan',
  'Giá đang xem': 'Displayed price',
  'Máy chủ sẽ kiểm tra lại gói và tạo đơn. Chỉ thanh toán khi bạn tiếp tục sang PayOS và xác nhận chuyển tiền.':
    'The server will re-check the plan and create the order. You only pay when you continue to PayOS and confirm the transfer.',
  'Không xác nhận được việc tạo đơn.': 'Order creation could not be confirmed.',
  'Đang tạo đơn…': 'Creating order…',
  'Tạo đơn thanh toán': 'Create payment order',
  'Đã tạo đơn {orderCode}. Chưa xác nhận thanh toán.':
    'Order {orderCode} created. Payment not confirmed yet.',
  'Số tiền đơn do máy chủ trả về:': 'Order amount returned by the server:',
  '. Kiểm tra số tiền trên PayOS trước khi trả.': '. Check the amount on PayOS before paying.',
  'Tiếp tục sang PayOS': 'Continue to PayOS',
  'Kiểm tra trạng thái đơn': 'Check order status',
  'Yêu cầu có thể đã tạo giao dịch trên máy chủ. Kiểm tra lịch sử trước khi tạo lại.':
    'The request may have created a transaction on the server. Check the history before creating another.',
  'Luồng thanh toán này dành cho người chăm sóc gia đình hoặc quản trị trung tâm có tổ chức.':
    'This payment flow is for personal Caregivers or center administrators with an organization.',
  'Chọn gói Personal': 'Choose a Personal plan',
  'Giao dịch của tôi': 'My transactions',
  'Mã đơn': 'Order code',
  'Số tiền': 'Amount',
  'Ngày tạo': 'Created',
  'Xem trạng thái': 'View status',
  'Chưa có giao dịch trên trang này.': 'No transactions on this page.',
  '{totalCount} giao dịch · Trang {page}/{p4}': '{totalCount} transactions · Page {page}/{p4}',
  'Kiểm tra thanh toán': 'Check payment',
  'Xem đơn đã thanh toán xong chưa; VisionAid xác nhận lại trước khi mở quyền sử dụng.':
    'Follow the order status and payment confirmation from VisionAid.',
  'Bạn đã quay về từ thao tác hủy trên cổng thanh toán. Trạng thái thực tế được kiểm tra bên dưới; trang này không tự hủy đơn.':
    'You returned from cancelling on the payment gateway. The actual status is checked below; this page does not cancel the order by itself.',
  'Liên kết thiếu mã đơn hợp lệ. Mở giao dịch từ lịch sử thanh toán.':
    'The link is missing a valid order code. Open the transaction from the payment history.',
  'Mã đơn: {code}': 'Order code: {code}',
  'Kiểm tra lại thanh toán': 'Re-check payment',
  'Chưa tìm thấy giao dịch trong lịch sử của tài khoản này. Hãy kiểm tra tài khoản hoặc tải lại; chưa thể xác nhận thanh toán.':
    "The transaction was not found in this account's history. Check the account or reload; the payment cannot be confirmed yet.",
  'Đã hết thời gian chờ tự động. Nếu đã trả tiền, hãy kiểm tra lại sau; không tạo đơn khác để trả thêm.':
    'Automatic waiting has timed out. If you have paid, check again later; do not create another order to pay again.',
  'Đang chờ xác nhận thanh toán. Việc cập nhật có thể mất một lúc; không cần thanh toán lại.':
    'Waiting for payment confirmation. The update may take a while; there is no need to pay again.',
  'Chưa có liên kết PayOS hợp lệ để tiếp tục. Hãy kiểm tra lại hoặc liên hệ hỗ trợ.':
    'There is no valid PayOS link to continue. Check again or contact support.',
  'Hủy đơn thanh toán': 'Cancel payment order',
  'Thời điểm thanh toán: {p1}': 'Paid at: {p1}',
  'Máy chủ ghi nhận giao dịch thất bại. Kiểm tra lịch sử và liên hệ hỗ trợ nếu tài khoản đã bị trừ tiền.':
    'The server recorded a failed transaction. Check the history and contact support if your account was charged.',
  'Đã dừng chờ tự động. Dùng Kiểm tra lại thanh toán hoặc tra cứu lịch sử.':
    'Automatic waiting stopped. Use Re-check payment or look up the history.',
  'Gói sử dụng hiện tại: {p1}. Quyền sử dụng do máy chủ quyết định.':
    'Current usage plan: {p1}. Usage rights are decided by the server.',
  'Hủy đơn ': 'Cancel order ',
  '? Liên kết thanh toán sẽ không còn sử dụng được nếu máy chủ hủy thành công.':
    '? The payment link will no longer be usable if the server cancels it successfully.',
  'Xin chào{p0}.': 'Hello{p0}.',
  'Chức năng chưa sẵn sàng': 'Feature not ready yet',
  'Màn hình này chưa được kết nối với máy chủ.': 'This screen is not connected to the server yet.',
  'Về thông tin phiên': 'Back to session information',
  'Vị trí ghi nhận và lịch sử di chuyển của người được phép theo dõi.':
    'Recorded locations and movement history of the people you may track.',
  'Tìm người được theo dõi': 'Find a tracked person',
  'Tải lại danh sách': 'Reload list',
  'Chưa có người dùng phù hợp hoặc liên kết được phép xem.':
    'No matching users or links you may view.',
  'Trang người dùng trước': 'Previous users page',
  'Trang người dùng sau': 'Next users page',
  'Tải lại vị trí': 'Reload locations',
  'Dữ liệu vị trí': 'Location data',
  'Người được theo dõi': 'Tracked person',
  'Thời gian ghi nhận': 'Recorded time',
  'Độ mới / lỗi': 'Freshness / error',
  'Tài khoản vô hiệu hóa': 'Account deactivated',
  'Đang tải…': 'Loading…',
  'Chưa có vị trí khả dụng': 'No location available yet',
  'Vị trí & lịch sử': 'Location & history',
  'Xem GPS của ': 'View GPS of ',
  'Thử lại vị trí': 'Retry location',
  'GPS của ': 'GPS of ',
  '{fullName}: vị trí và lịch sử': '{fullName}: location and history',
  'Chưa có vị trí khả dụng. Lịch sử bên dưới có thể vẫn còn dữ liệu.':
    'No location available yet. The history below may still have data.',
  'Địa chỉ:': 'Address:',
  'Chưa có địa chỉ': 'No address yet',
  'Ghi nhận GPS: {p1} · Máy chủ cập nhật: {p5}': 'GPS recorded: {p1} · Server updated: {p5}',
  'Pin, mạng và độ chính xác của vị trí hiện tại chưa được máy chủ cung cấp. Xem giá trị tại từng bản ghi lịch sử bên dưới.':
    'Battery, network and accuracy of the current location are not in this API. See the values in each history record below.',
  'Lịch sử di chuyển': 'Movement history',
  'Thời gian không hợp lệ.': 'Invalid time.',
  'Không có lịch sử trong khoảng thời gian này.': 'No history in this time range.',
  'Vĩ độ / kinh độ': 'Latitude / longitude',
  'Độ cao': 'Altitude',
  'Tốc độ': 'Speed',
  Hướng: 'Heading',
  'Mạng lúc ghi nhận': 'Network when recorded',
  'Ngoại tuyến': 'Offline',
  '{totalCount} bản ghi · Trang {page}/{p4}': '{totalCount} records · Page {page}/{p4}',
  'Lịch sử trước': 'Previous history',
  'Lịch sử sau': 'Next history',
  'Tổ chức đang hoạt động': 'Active organizations',
  'Mạng lưới hỗ trợ': 'Support network',
  'Tài khoản hoạt động': 'Active accounts',
  'Trên toàn nền tảng': 'Across the platform',
  'Mô hình AI': 'AI models',
  'Chỉ số tổng hợp': 'Aggregated metrics',
  'Thông báo gửi lỗi': 'Failed deliveries',
  'Cần kiểm tra · mô phỏng': 'Needs checking · simulated',
  'Trong tổ chức của bạn': 'In your organization',
  'Đang được liên kết': 'Currently linked',
  'Cảnh báo đang mở': 'Open alerts',
  'Ưu tiên phản hồi kịp thời': 'Respond promptly',
  'Người cùng đồng hành': 'Fellow caregivers',
  'Trong trung tâm': 'In the center',
  'Chia sẻ trách nhiệm chăm sóc': 'Sharing care responsibilities',
  'Vị trí cập nhật gần đây': 'Recently updated locations',
  'Dữ liệu trong 2 phút gần nhất': 'Data from the last 2 minutes',
  'Xin chào, {p0}.': 'Hello, {p0}.',
  'Một góc nhìn rõ ràng về toàn bộ nền tảng.': 'A clear view of the whole platform.',
  'Cùng đội ngũ tạo nên một ngày an toàn hơn.': 'Together with the team, making every day safer.',
  'Mọi kết nối đều bắt đầu từ sự quan tâm.': 'Every connection starts with care.',
  'Tổ chức đồng hành': 'Partner organizations',
  'Vị trí người thân': "Loved ones' locations",
  'Xem tất cả': 'View all',
  'Phạm vi được cấp quyền': 'Granted scope',
  'Sơ đồ mô phỏng · Không dùng để chỉ đường': 'Simulated diagram · Not for navigation',
  'Những người đang đồng hành': 'People you support',
  'Quản lý danh sách →': 'Manage list →',
  'Chưa có người được chăm sóc. Thêm hoặc phân công ở trang người dùng.':
    'No care recipients yet. Add or assign them on the users page.',
  'Nhật ký gần đây': 'Recent log',
  'Cần bạn quan tâm': 'Needs your attention',
  'Chưa có cảnh báo đang mở.': 'No open alerts.',
  'Mở nhật ký thao tác': 'Open audit log',
  'Xem tất cả cảnh báo': 'View all alerts',
  'Số liệu demo chưa phản ánh sức khỏe máy chủ thật.':
    'Demo figures do not reflect real server health.',
  'Luôn kiểm tra thời gian ghi nhận. Vị trí cũ không phản ánh vị trí trực tiếp.':
    'Always check the recorded time. A stale location does not reflect the live location.',
  'Mở trung tâm cảnh báo': 'Open alert center',
  'Phạm vi chăm sóc': 'Care scope',
  'Người được phân công': 'Assigned people',
  'Tài khoản chưa có tổ chức. Liên hệ quản trị viên để kiểm tra phân công.':
    'The account has no organization yet. Contact an administrator to check the assignment.',
  'Đã cấp': 'Assigned',
  'Thanh toán gần đây': 'Recent payments',
  'Mở lịch sử thanh toán': 'Open payment history',
  'Đã gửi': 'Sent',
  'Đang chờ gửi': 'Pending delivery',
  'Tải lại thống kê': 'Reload statistics',
  'Danh sách suất đã cấp': 'License assignment list',
  'Suất đã cấp': 'Assigned licenses',
  'Cấp suất sử dụng cho người được chăm sóc đã có tài khoản trong tổ chức. Nhân viên chăm sóc không tính vào số suất.':
    'Assign licenses to care recipients who already have accounts in the organization. Care staff do not use license seats.',
  'Trạng thái cấp': 'Assignment status',
  'Chưa thu hồi': 'Not revoked',
  'Đã thu hồi': 'Revoked',
  'Cấp suất sử dụng': 'Assign license',
  'Mua thêm suất sử dụng': 'Buy more licenses',
  'Suất đã cấp cho người được chăm sóc': 'Licenses assigned to care recipients',
  'Ngày cấp': 'Assigned on',
  'Đã thu hồi · {p0}': 'Revoked · {p0}',
  'Thu hồi': 'Revoke',
  'Không có suất sử dụng phù hợp bộ lọc.': 'No licenses match the filter.',
  'Chưa thu hồi không đồng nghĩa còn hạn sử dụng; thời hạn và quyền truy cập do máy chủ kiểm tra.':
    'Not revoked does not mean still valid; validity and access are checked by the server.',
  'Chọn người được chăm sóc của tổ chức. Thao tác sử dụng một suất trong kho hiện tại; có thể cấp lại cho người đã bị thu hồi.':
    'Choose a care recipient of the organization. This uses one seat from the current pool; a revoked person can be assigned again.',
  'Đang tải danh sách người được chăm sóc…': 'Loading care recipients…',
  'Trung tâm chưa có người được chăm sóc đang hoạt động.':
    'The center has no active care recipients yet.',
  'Xác nhận cấp suất sử dụng': 'Confirm license assignment',
  'Đã cấp suất sử dụng. Số lượng trong kho được tải lại từ máy chủ.':
    'License assigned. Pool quantities are reloaded from the server.',
  'Nếu báo lỗi hoặc mất kết nối, kiểm tra lại danh sách trước khi gửi lại. Hết suất hoặc hết hạn:':
    'If an error occurs or the connection drops, check the list again before resubmitting. Out of seats or expired:',
  'xem gói Business': 'see Business plans',
  'Thu hồi suất sử dụng': 'Revoke license',
  'Thu hồi suất sử dụng của {fullName}? Người này sẽ mất quyền sử dụng theo gói của tổ chức. Tài khoản và phân công chăm sóc vẫn được giữ.':
    'Revoke the license of {fullName}? They will lose usage rights under the organization license. The account and care assignment are kept.',
  'Đã thu hồi suất sử dụng. Số lượng trong kho được tải lại từ máy chủ.':
    'License revoked. Pool quantities are reloaded from the server.',
  'Gói Personal của bạn đã hết hạn và quá thời gian gia hạn. Gia hạn qua PayOS hoặc kích hoạt mã do trung tâm cấp để dùng lại chức năng này.':
    'Your Personal plan has expired and its grace period is over. Renew via PayOS or activate a key issued by a center to use this feature again.',
  'Gia hạn gói Personal': 'Renew Personal plan',
  'Kích hoạt bằng mã': 'Activate with a key',
  'Khi chưa có gói, bạn vẫn nhận và xử lý': 'Without a plan you can still receive and handle',
  'và xem': 'and view',
  '. Sau khi thanh toán thành công, trang sẽ tự mở khóa khi máy chủ xác nhận.':
    '. After a successful payment, the page unlocks automatically once the server confirms.',
  'cảnh báo khẩn cấp': 'emergency alerts',
  'lịch sử cuộc gọi': 'call history',
  'Phát mã kích hoạt': 'Key distribution',
  'Kích hoạt mã': 'Activate key',
  'Mã kích hoạt cho gia đình': 'Keys for families',
  'Mỗi mã kích hoạt sử dụng một suất ngay khi tạo, hết hạn theo kho của trung tâm. Bạn tự chuyển mã kích hoạt cho gia đình.':
    "Each key uses one seat as soon as it is created and expires with the center's pool. You hand the key to the family yourself.",
  'Nhập mã kích hoạt do trung tâm cấp. Thời hạn theo mã kích hoạt, không tự cộng thêm thời gian dùng thử hoặc gói đang có. Kích hoạt không thay đổi tổ chức hay liên kết chăm sóc.':
    'Enter the key issued by the center. Validity follows the key and is not added to an existing trial or plan. Activation does not change the organization or care links.',
  'Kết quả chưa rõ. Không gửi lại thao tác; hãy tải lại thông tin gói dịch vụ và nhờ quản trị viên kiểm tra.':
    'The result is unclear. Do not resubmit; reload the license information and ask an administrator to check.',
  'Xem mã kích hoạt vừa tạo': 'View the created key',
  'Tạo mã kích hoạt cho gia đình': 'Create a key for a family',
  'Nhập mã kích hoạt': 'Enter activation key',
  'Tạo mã kích hoạt khác': 'Create another key',
  'Bắt đầu mã kích hoạt mới': 'Start a new key',
  'Kích hoạt gói dịch vụ': 'Activate license',
  'Đã tạo mã kích hoạt và dùng một suất trong kho.': 'Key created and one license seat used.',
  'Mã kích hoạt vừa tạo': 'Created key',
  'Hạn dùng:': 'Valid until:',
  'Máy chủ không cung cấp thời hạn': 'The server does not provide an expiry',
  'Ẩn mã kích hoạt': 'Hide key',
  'Hiện mã kích hoạt': 'Show key',
  'Sao chép mã kích hoạt': 'Copy key',
  'Đã sao chép mã kích hoạt.': 'Key copied.',
  'Không sao chép được. Nhấn Hiện mã kích hoạt để sao chép thủ công.':
    'Could not copy. Press Show key to copy it manually.',
  'Xác nhận tạo một mã kích hoạt và sử dụng một suất trong kho. Ghi chú không phải địa chỉ gửi thư.':
    'Confirm creating one key and using one seat from the pool. The note is not a mailing address.',
  'Xác nhận sử dụng mã kích hoạt một lần cho tài khoản của bạn. Hãy kiểm tra thời hạn với trung tâm trước khi kích hoạt.':
    'Confirm using the key once for your account. Check its validity with the center before activating.',
  'Xác nhận tạo mã kích hoạt': 'Confirm key creation',
  'Xác nhận kích hoạt': 'Confirm activation',
  'Máy chủ đã xác nhận kích hoạt. Xem trạng thái và thời hạn mới ở thẻ "Trạng thái và gói".':
    'The server confirmed the activation. See the new status and expiry in the "Status and package" tab.',
  'Hồ sơ của bạn': 'Your profile',
  'Thông tin cá nhân, mật khẩu và các thiết bị đang đăng nhập.':
    'Personal information and sign-in session protection.',
  'Thông tin cá nhân': 'Personal information',
  'Chỉnh sửa hồ sơ': 'Edit profile',
  'Chọn ảnh JPG/PNG dưới 2 MB.': 'Choose a JPG/PNG image under 2 MB.',
  'Đã cập nhật ảnh đại diện demo.': 'Demo avatar updated.',
  'Ảnh đại diện của bạn': 'Your avatar',
  'Đổi mật khẩu': 'Change password',
  'Dùng mật khẩu riêng cho VisionAid. Bạn cần nhập mật khẩu hiện tại để thay đổi.':
    'Use a unique password for VisionAid. You need to enter your current password to change it.',
  'Mật khẩu hiện tại': 'Current password',
  'Đã đổi mật khẩu demo.': 'Demo password changed.',
  'Mật khẩu mới: 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Sau khi đổi thành công, bạn cần đăng nhập lại.':
    'New password: 8–100 characters with uppercase, lowercase, a number and a special character. After a successful change, you must sign in again.',
  'Phiên đăng nhập': 'Sign-in sessions',
  'Thu hồi quyền gia hạn phiên và nhận thông báo trên mọi thiết bị. Phiên truy cập hiện có trên thiết bị khác có thể còn hiệu lực đến khi hết hạn.':
    'Revokes session renewal and notifications on all devices. Existing access sessions on other devices may stay valid until they expire.',
  'Đăng xuất tất cả thiết bị': 'Sign out of all devices',
  'Đăng xuất tất cả thiết bị?': 'Sign out of all devices?',
  'Tab này sẽ đăng xuất ngay. Các thiết bị khác sẽ cần đăng nhập lại khi gia hạn phiên.':
    'This tab signs out immediately. Other devices will need to sign in again when renewing the session.',
  'Không tìm thấy trang': 'Page not found',
  'Đường dẫn không tồn tại, đã được đổi hoặc bạn gõ nhầm. Dữ liệu của bạn không bị ảnh hưởng.':
    'The address does not exist, has changed or was mistyped. Your data is not affected.',
  'Bạn không có quyền xem trang này': 'You do not have permission to view this page',
  'Trang này dành cho vai trò khác. Nếu bạn cần truy cập, hãy liên hệ quản trị trung tâm hoặc quản trị hệ thống.':
    'This page is for another role. If you need access, contact your center administrator or the system administrator.',
  'Màn hình này gặp sự cố': 'This screen ran into a problem',
  'Một lỗi bất ngờ khiến màn hình không hiển thị được. Thao tác đang gửi có thể chưa hoàn tất. Hãy tải lại và kiểm tra trước khi làm lại.':
    'An unexpected error prevented the screen from displaying. An action being sent may not have completed. Reload and check before trying again.',
  'Cần gói dịch vụ để dùng chức năng này': 'A service plan is required for this feature',
  'Tài khoản của bạn chưa có gói Personal. Đăng ký gói qua PayOS hoặc kích hoạt mã do trung tâm cấp để mở chức năng này.':
    'Your account does not have a Personal plan yet. Subscribe via PayOS or activate a key issued by a center to unlock this feature.',
  'Tài khoản này không dùng trên Web': 'This account is not used on the Web',
  'Người khiếm thị sử dụng VisionAid qua ứng dụng di động. Web dành cho người chăm sóc, quản trị trung tâm và quản trị hệ thống.':
    'Visually impaired people use VisionAid through the mobile app. The Web is for caregivers, center administrators and system administrators.',
  'Thông tin kỹ thuật': 'Technical details',
  'Tải lại trang': 'Reload page',
  'Tài khoản toàn hệ thống': 'System-wide accounts',
  'Xác nhận khôi phục cấu hình': 'Confirm configuration rollback',
  'Điều chỉnh cấu hình': 'Adjust configuration',
  'Giá trị hiện tại': 'Current value',
  'Giới hạn': 'Limits',
  'Khôi phục về giá trị trước lần thay đổi lúc {p1}:':
    'Restore the value from before the change at {p1}:',
  '. Một bản ghi lịch sử mới sẽ được tạo.': '. A new history record will be created.',
  'Chưa xác nhận được kết quả ghi. Đóng hộp thoại và tải lại cấu hình cùng lịch sử trước khi gửi lại.':
    'The write result was not confirmed. Close the popup and reload the configuration and history before resubmitting.',
  'Giá trị mới': 'New value',
  'Lý do thay đổi': 'Reason for change',
  'Xác nhận khôi phục': 'Confirm rollback',
  'Lưu cấu hình': 'Save configuration',
  'Chưa có mô tả.': 'No description yet.',
  'Cập nhật lúc': 'Updated at',
  'Điều chỉnh': 'Adjust',
  'Lịch sử thay đổi': 'Change history',
  'Lịch sử cấu hình': 'Configuration history',
  'Trước → Sau': 'Before → After',
  'Lý do / người thay đổi': 'Reason / changed by',
  'Không ghi lý do': 'No reason given',
  'Khôi phục': 'Restore',
  'Chưa có lịch sử thay đổi.': 'No change history yet.',
  'Chi tiết cấu hình': 'Configuration details',
  'Đã lưu cấu hình. Điện thoại áp dụng ở lần đồng bộ tiếp theo.':
    'Setting saved. Phones apply it at their next sync.',
  'Tìm cấu hình': 'Find configuration',
  'Nhóm cấu hình': 'Configuration group',
  'Danh sách cấu hình': 'Configuration list',
  'Giá trị': 'Value',
  'Chưa có cấu hình phù hợp.': 'No matching configurations.',
  'Chỉ quản trị viên hệ thống được quản lý máy chủ kết nối.':
    'Only system administrators can manage connection servers.',
  'Thêm máy chủ': 'Add server',
  'Trạng thái máy chủ': 'Server status',
  'Đang tắt': 'Disabled',
  'Không có máy chủ phù hợp.': 'No matching servers.',
  'Máy chủ kết nối cuộc gọi': 'ICE servers',
  '{totalCount} máy chủ · Trang {page}/{p4}': '{totalCount} servers · Page {page}/{p4}',
  'Xóa máy chủ kết nối': 'Delete connection server',
  'Chỉnh sửa máy chủ kết nối': 'Edit connection server',
  'Thêm máy chủ kết nối': 'Add connection server',
  'Máy chủ: {url}': 'Server: {url}',
  'Xóa cấu hình có thể làm cuộc gọi mới không kết nối được. Chỉ xóa khi đã có máy chủ thay thế phù hợp.':
    'Deleting the configuration may stop new calls from connecting. Only delete when a suitable replacement server exists.',
  'Chưa xác nhận kết quả ghi. Đóng hộp thoại và tải lại danh sách trước khi gửi lại để tránh tạo hoặc ghi trùng.':
    'The write result was not confirmed. Close the popup and reload the list before resubmitting to avoid duplicate creates or writes.',
  'Loại máy chủ': 'Server type',
  'Địa chỉ máy chủ': 'Server address',
  'Bật máy chủ': 'Enable server',
  'Xác nhận xóa': 'Confirm deletion',
  'Lưu máy chủ': 'Save server',
  'Mã phiên điều hướng': 'Navigation session ID',
  'Mã khung hình': 'Frame ID',
  'Quyết định': 'Decision',
  'Mã bản ghi': 'Record ID',
  'Mô hình': 'Model',
  'Phiên bản': 'Version',
  'Nguồn dữ liệu': 'Data source',
  'Tổng lượt': 'Total requests',
  'Độ tin cậy trung bình': 'Average confidence',
  'Thời gian trung bình': 'Average time',
  'Thời gian P95': 'P95 time',
  'Thời gian P99': 'P99 time',
  'Số lỗi': 'Errors',
  'Nguồn tổng hợp': 'Aggregation source',
  'Tổng hợp lúc': 'Aggregated at',
  'Người thực hiện': 'Actor',
  'Email người thực hiện': 'Actor email',
  'Mã người thực hiện': 'Actor ID',
  'Hành động': 'Action',
  'Mã đối tượng': 'Entity ID',
  'Nguồn thông báo': 'Notification source',
  'Mã cảnh báo khẩn cấp': 'Emergency alert ID',
  'Mã sự kiện vùng an toàn': 'Safe zone event ID',
  'Mã người nhận': 'Recipient ID',
  'Kênh gửi': 'Delivery channel',
  'Lý do thất bại': 'Failure reason',
  'Thời gian tạo': 'Created at',
  'Dừng lại': 'Stop',
  'Rẽ trái': 'Turn left',
  'Rẽ phải': 'Turn right',
  'Tiếp tục': 'Continue',
  'Hệ thống hoặc chưa ghi nhận': 'System or not recorded',
  'Chỉ quản trị viên hệ thống được xem dữ liệu này.':
    'Only system administrators can view this data.',
  'Số cảnh báo đã gửi được hoặc bị lỗi, và danh sách thông báo gửi không thành công.':
    'Alert delivery statistics and failed notification lookup.',
  'Thông báo thất bại': 'Failed notifications',
  'Tra cứu bản ghi': 'Look up records',
  'Mọi bộ xử lý': 'All engines',
  'Điện thoại tự quyết định': 'With fallback',
  'Tên mô hình': 'Model name',
  'Tất cả kênh': 'All channels',
  'Lọc bản ghi': 'Filter records',
  'Chi tiết hiển thị thông tin thao tác. Nội dung trước/sau, ghi chú và thông tin thiết bị chưa hiển thị vì có thể chứa dữ liệu nhạy cảm.':
    'Details show action information. Before/after content, notes and device information are hidden because they may contain sensitive data.',
  'Xem số liệu AI': 'View AI metrics',
  'Cấu hình bộ xử lý': 'Engine configuration',
  'Không có bản ghi phù hợp.': 'No matching records.',
  'Chi tiết bản ghi': 'Record details',
  'Tổng quan gửi cảnh báo': 'Alert delivery overview',
  'Khoảng thời gian': 'Time range',
  'Đang chờ': 'Pending',
  'Theo dõi các thao tác quản trị. Chỉ xem, không xóa hoặc sửa được.':
    'Follow administrative actions. Read-only; audit records cannot be deleted or edited in the interface.',
  'Lịch sử hệ thống': 'System history',
  'Chi tiết bản ghi nhật ký': 'Audit record details',
  'Nền tảng / cá nhân': 'Platform / personal',
  'Chỉnh thiết lập chung, có lưu lịch sử và quay lại được. Đây là dữ liệu mô phỏng, chưa ảnh hưởng thiết bị thật.':
    'Controlled changes with tracing and rollback. These are demo parameters that do not affect real devices.',
  'Thông số đang áp dụng': 'Parameters in effect',
  'Thông số': 'Parameter',
  'Người thay đổi': 'Changed by',
  'Khôi phục giá trị trước': 'Restore previous value',
  'Điều chỉnh ': 'Adjust ',
  'Giá trị ({unit})': 'Value ({unit})',
  'Khôi phục cấu hình?': 'Roll back configuration?',
  'Đặt {name} về {before}. Thao tác tạo thêm một bản ghi lịch sử, không xóa lịch sử hiện có.':
    'Set {name} to {before}. This adds a history record and does not delete the existing history.',
  'Đã gửi · mô phỏng': 'Sent · simulated',
  'Thất bại · mô phỏng': 'Failed · simulated',
  'Đang chờ · mô phỏng': 'Pending · simulated',
  'Theo dõi thông báo đã gửi tới đâu theo từng cách gửi. Toàn bộ bản ghi dưới đây là dữ liệu minh họa, không phải xác nhận gửi thật.':
    'Monitor delivery status by channel. All records below are illustrative data, not confirmation of real delivery.',
  'Nhật ký gửi thông báo': 'Delivery log',
  'Trạng thái gửi': 'Delivery status',
  'Mọi trạng thái': 'All statuses',
  'Mọi kênh': 'All channels',
  'Chi tiết gửi thông báo (mô phỏng)': 'Simulated delivery details',
  'Kịch bản demo: nhà cung cấp tạm thời không khả dụng. Chưa hỗ trợ gửi lại.':
    'Demo scenario: the provider is temporarily unavailable. No confirmed retry API yet.',
  'Bản ghi trạng thái minh họa của bản demo.': 'Illustrative status records from the mock service.',
  'Số liệu mô phỏng theo từng mô hình AI và từng ngày. Mức độ chắc chắn và tỷ lệ xử lý thành công không có nghĩa là AI nhận diện đúng.':
    'Simulated aggregated metrics by model and date. Confidence and processing success rate are not ground-truth accuracy.',
  'Tất cả mô hình': 'All models',
  'Lượt xử lý': 'Requests processed',
  'Thời gian phản hồi trung bình': 'Average latency',
  'Xử lý thành công': 'Processed successfully',
  'Thời gian phản hồi theo mô hình': 'Latency by model',
  'Thang hiển thị 0–1.000 ms · dữ liệu demo': 'Display scale 0–1,000 ms · demo data',
  'Chi tiết theo ngày': 'Details by day',
  Ngày: 'Date',
  'Thành công / tổng': 'Success / total',
  'Khởi tạo tổ chức và quản lý trạng thái hoạt động. Vô hiệu hóa tổ chức sẽ chặn phiên đăng nhập của thành viên.':
    "Set up organizations and manage their active status. Deactivating an organization blocks its members' sign-in sessions.",
  'Dữ liệu tài khoản từ máy chủ không hợp lệ.': 'Account data from the server is invalid.',
  'Không có quyền quản lý tài khoản này.': 'You are not allowed to manage this account.',
  'Mã không hợp lệ.': 'The ID must be a valid UUID.',
  'Tài khoản trả về không khớp lựa chọn.': 'The returned account does not match the selection.',
  'Tài khoản đã xóa; hệ thống hiện không hỗ trợ khôi phục.':
    'The account is deleted; the API does not support restoring it.',
  'Vai trò không hợp lệ.': 'Invalid role.',
  'Danh sách trả về không khớp vai trò đã chọn.':
    'The returned list does not match the selected role.',
  'Chỉ quản trị trung tâm chọn từ danh sách tổ chức.':
    'Only center administrators choose from the organization list.',
  'Trung tâm chỉ tạo người chăm sóc hoặc người khiếm thị.':
    'Centers can only create Caregivers or VIUs.',
  'Mật khẩu cần ít nhất 8 ký tự, chữ hoa/thường, số và ký tự đặc biệt.':
    'Password must be at least 8 characters with upper/lowercase letters, a number and a special character.',
  'Tổ chức không hợp lệ hoặc không hoạt động.': 'The organization is invalid or inactive.',
  'Không thể tự vô hiệu hóa.': 'You cannot deactivate yourself.',
  'Chỉ quản trị viên hệ thống được xóa tài khoản.': 'Only Admins can delete accounts.',
  'Không thể tự xóa tài khoản.': 'You cannot delete your own account.',
  'Đọc chữ': 'Text reading',
  'Dữ liệu lịch sử từ máy chủ không hợp lệ.': 'History data from the server is invalid.',
  'Mã lịch sử hoặc người được chăm sóc không hợp lệ.': 'Invalid history or care recipient ID.',
  'Lịch sử không thuộc người hoặc bản ghi được chọn.':
    'The history does not belong to the selected person or record.',
  'Trang không hợp lệ.': 'Invalid page.',
  'Ngày lọc không hợp lệ.': 'Invalid filter date.',
  'Lịch sử này dành cho người chăm sóc có liên kết.': 'This history is for caregivers with a link.',
  'Bạn không còn liên kết chăm sóc hoạt động với người này.':
    'You no longer have an active care link with this person.',
  'Máy chủ trả về sai trang lịch sử.': 'The server returned the wrong history page.',
  'Máy chủ trả về sai trang phát hiện.': 'The server returned the wrong detection page.',
  'Phát hiện không thuộc phiên được chọn.':
    'The detection does not belong to the selected session.',
  'Chức năng này chưa sẵn sàng. Hiện hỗ trợ đăng ký, đăng nhập, hồ sơ, đổi mật khẩu và đăng xuất.':
    'This feature is not integrated with the API yet. Currently supported: sign-up, sign-in, profile, change password and sign-out.',
  'Phản hồi phiên đăng nhập không hợp lệ.': 'Invalid sign-in session response.',
  'Không thể lưu phiên. Cho phép bộ nhớ trình duyệt rồi đăng nhập lại.':
    'Could not save the session. Allow browser storage and sign in again.',
  'Chưa cấu hình VITE_API_BASE_URL.': 'VITE_API_BASE_URL is not configured.',
  'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ Web.':
    'Could not reach the server. Check your network and the Web address.',
  'Phản hồi máy chủ không đúng định dạng.': 'The server response has an unexpected format.',
  'Yêu cầu không thành công.': 'The request was not successful.',
  'Phiên đã kết thúc. Vui lòng đăng nhập lại.': 'The session has ended. Please sign in again.',
  'Phiên đã kết thúc.': 'The session has ended.',
  'Phiên đăng nhập đã hết hạn hoặc đã bị đăng xuất. Vui lòng đăng nhập lại.':
    'The sign-in session has expired or was signed out. Please sign in again.',
  'Vui lòng đăng nhập.': 'Please sign in.',
  'Hồ sơ từ máy chủ không hợp lệ hoặc vai trò chưa được hỗ trợ.':
    'The profile from the server is invalid or the role is not supported yet.',
  'Tài khoản này không được truy cập trang quản lý trên web.':
    'This account may not access the Web Dashboard.',
  'Yêu cầu đăng nhập đã bị hủy.': 'The sign-in request was cancelled.',
  'Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu. Kiểm tra hộp thư và thư rác; liên kết có hiệu lực 15 phút.':
    'If this email is registered, you will receive a password reset link. Check your inbox and spam folder; the link is valid for 15 minutes.',
  'Liên kết khôi phục không hợp lệ.': 'Invalid recovery link.',
  'Liên kết không hợp lệ hoặc email không khớp với liên kết.':
    'The link is invalid or the email does not match the link.',
  'Vui lòng nhập mã hoặc liên kết trong email.': 'Please enter the code or link from the email.',
  'Mật khẩu cần 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.':
    'Password must be 8–100 characters with uppercase, lowercase, a number and a special character.',
  'Mã không hợp lệ, đã dùng hoặc hết hạn. Hãy yêu cầu email khôi phục mới.':
    'The code is invalid, used or expired. Request a new recovery email.',
  'Mật khẩu mới cần 8–100 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt và khác mật khẩu cũ.':
    'The new password must be 8–100 characters with uppercase, lowercase, a number, a special character and differ from the old one.',
  'Mật khẩu hiện tại không đúng.': 'The current password is incorrect.',
  'Không thể hoàn tất đăng ký.': 'Could not complete sign-up.',
  ' Nếu tài khoản đã được tạo, hãy thử đăng nhập; không gửi lại đăng ký liên tục.':
    ' If the account was created, try signing in; do not resubmit sign-up repeatedly.',
  'Đã khởi tạo': 'Initiated',
  'Đang đổ chuông': 'Ringing',
  'Đã chấp nhận': 'Accepted',
  'Đã kết thúc': 'Ended',
  Nhỡ: 'Missed',
  'Đã từ chối': 'Declined',
  'Người dùng cúp máy': 'User hung up',
  'Hủy trước khi được nghe máy': 'Cancelled before being answered',
  'Không ai nghe máy': 'No one answered',
  'Kết nối thất bại': 'Connection failed',
  'Kết nối âm thanh/hình ảnh thất bại': 'Audio/video connection failed',
  'Không khởi tạo được cuộc gọi': 'Could not start the call',
  'Chờ kết nối quá lâu': 'Waited too long to connect',
  'Mất micro': 'Microphone lost',
  'Không còn xác minh được phiên gọi': 'The call session could no longer be verified',
  'Rời trang khi đang gọi': 'Left the page during the call',
  'Người chăm sóc gọi': 'Caregiver call',
  'Mã cuộc gọi không hợp lệ.': 'Invalid call ID.',
  'Thông tin kết nối cuộc gọi không hợp lệ. Kiểm tra lịch sử trước khi gọi lại.':
    'Invalid call connection information. Check the history before calling again.',
  'Chỉ người chăm sóc được thực hiện cuộc gọi.': 'Only caregivers can make calls.',
  'Bạn không còn liên kết chăm sóc hoạt động.': 'You no longer have an active care link.',
  'Bạn không có quyền xem lịch sử cuộc gọi.': 'You do not have permission to view call history.',
  'Các cuộc gọi của người khiếm thị thuộc trung tâm. Chỉ xem, không gọi từ đây.':
    'Calls of visually impaired users in your center. View only; calls are not made from here.',
  'Mã người được chăm sóc không hợp lệ.': 'The care recipient ID must be a UUID.',
  'Thời gian bắt đầu phải trước thời gian kết thúc.': 'The start time must be before the end time.',
  'Lịch sử cuộc gọi từ máy chủ không hợp lệ.': 'Call history from the server is invalid.',
  'Máy chủ trả cuộc gọi ngoài phạm vi yêu cầu.':
    'The server returned calls outside the requested scope.',
  'Dữ liệu người dùng hoặc liên kết không đúng định dạng.':
    'User or link data has an invalid format.',
  'Liên kết không thuộc tài khoản hoặc người được chọn.':
    'The link does not belong to the account or the selected person.',
  'Bạn đã có tối đa {max} liên kết hoạt động. Chưa tạo tài khoản mới.':
    'You already have the maximum of {max} active links. No new account was created.',
  'Mã liên kết không hợp lệ.': 'Invalid link ID.',
  'Chỉ có thể gỡ liên kết cá nhân đang hoạt động của bạn.':
    'You can only remove your own active personal links.',
  'Dữ liệu cấu hình không hợp lệ.': 'Invalid configuration data.',
  'Chỉ quản trị hệ thống được quản lý cấu hình.':
    'Only system administrators can manage configurations.',
  'Mã cấu hình không hợp lệ.': 'Invalid configuration ID.',
  'Khóa này chưa được duyệt để hiển thị hoặc sửa trên Web.':
    'This key is not approved for display or editing on the Web.',
  'Giá trị không được để trống.': 'The value cannot be empty.',
  'Nhập số hợp lệ, dùng dấu chấm cho phần thập phân.':
    'Enter a valid number, using a dot for decimals.',
  'Giá trị nằm ngoài giới hạn cấu hình.': 'The value is outside the configuration limits.',
  'Giá trị phải là true hoặc false.': 'The value must be true or false.',
  'Dữ liệu không đúng định dạng.': 'Invalid JSON.',
  'Giá trị không nằm trong lựa chọn được hỗ trợ.': 'The value is not one of the supported options.',
  'Nhập URL STUN hợp lệ, không chứa thông tin đăng nhập.':
    'Enter a valid STUN URL without credentials.',
  'Cấu hình không khớp lựa chọn.': 'The configuration does not match the selection.',
  'Cấu hình đã thay đổi. Đóng hộp thoại và tải lại trước khi sửa.':
    'The configuration has changed. Close the popup and reload before editing.',
  'Lý do tối đa 500 ký tự.': 'The reason can be at most 500 characters.',
  'Chưa xác nhận được kết quả lưu. Tải lại cấu hình trước khi gửi lại.':
    'The save result was not confirmed. Reload the configuration before resubmitting.',
  'Lịch sử không thuộc cấu hình được chọn.':
    'The history does not belong to the selected configuration.',
  'Không xác minh được giá trị khôi phục. Tải lại lịch sử.':
    'Could not verify the rollback value. Reload the history.',
  'Nhập số điện thoại hợp lệ.': 'Enter a valid phone number.',
  'Nhập liên kết Zalo.': 'Enter a Zalo link.',
  'Màn hình này dành cho người chăm sóc có liên kết.': 'This screen is for caregivers with a link.',
  'Dữ liệu liên hệ từ máy chủ không hợp lệ.': 'Contact data from the server is invalid.',
  'Liên hệ không thuộc người được chọn.': 'The contact does not belong to the selected person.',
  'Danh sách liên hệ không hợp lệ.': 'Invalid contact list.',
  'Thứ tự ưu tiên {priorityOrder} đã được dùng cho liên hệ khác. Chọn số khác.':
    'Priority {priorityOrder} is already used by another contact. Choose another number.',
  'Thứ tự ưu tiên đã được dùng.': 'The priority order is already used.',
  'Mới phát hiện': 'Newly detected',
  'Đã tiếp nhận': 'Received',
  'Đã gọi': 'Called',
  'Tiếp nhận cảnh báo': 'Acknowledge alert',
  'Dữ liệu cảnh báo từ máy chủ không hợp lệ.': 'Alert data from the server is invalid.',
  'Không có quyền truy cập cảnh báo.': 'You are not allowed to access alerts.',
  'Mã định danh không hợp lệ.': 'Invalid identifier.',
  'Cảnh báo không khớp yêu cầu.': 'The alert does not match the request.',
  'Trạng thái không hợp lệ.': 'Invalid status.',
  'Cảnh báo không thuộc người khiếm thị được chọn.':
    'The alert does not belong to the selected VIU.',
  'Trạng thái đã thay đổi. Hãy xem dữ liệu mới trước khi xử lý.':
    'The status has changed. Review the new data before handling.',
  'Bạn không có quyền xử lý cảnh báo này.': 'You are not allowed to handle this alert.',
  'Phản hồi chuyển cấp không khớp cảnh báo.': 'The escalation response does not match the alert.',
  'Phản hồi máy chủ kết nối không hợp lệ.': 'Invalid connection server response.',
  'Bộ lọc máy chủ không hợp lệ.': 'Invalid server filter.',
  'Mã máy chủ không hợp lệ.': 'Invalid server ID.',
  'Danh sách hoặc cấu hình đã thay đổi. Đóng hộp thoại và tải lại trước khi tiếp tục.':
    'The list or configuration has changed. Close the popup and reload before continuing.',
  'Không thể xác nhận thao tác máy chủ kết nối. Kiểm tra quyền, dữ liệu và tải lại danh sách.':
    'Could not confirm the connection server action. Check permissions and data, then reload the list.',
  'Phản hồi không khớp thay đổi. Tải lại danh sách để kiểm tra kết quả.':
    'The response does not match the change. Reload the list to check the result.',
  'Chỉ quản trị trung tâm có tổ chức được quản lý gói dịch vụ.':
    'Only center administrators with an organization can manage licenses.',
  'Chỉ cấp hoặc thu hồi suất sử dụng của người được chăm sóc.':
    'Licenses can only be assigned to or revoked from care recipients.',
  'Bộ lọc suất sử dụng không hợp lệ.': 'Invalid license filter.',
  'Dữ liệu suất đã cấp không hợp lệ. Hãy tải lại.':
    'Invalid license assignment data. Please reload.',
  'Không thể cấp suất sử dụng cho tài khoản đã khóa hoặc xóa.':
    'Cannot assign a license to a locked or deleted account.',
  'Kho suất sử dụng không còn hiệu lực. Hãy kiểm tra gói Business.':
    'The license pool is no longer valid. Check the Business plan.',
  'Kho đã hết suất sử dụng. Hãy mua thêm gói Business rồi thử lại.':
    'The pool is out of licenses. Buy another Business plan and try again.',
  'Chưa xác nhận được kết quả cấp suất sử dụng. Tải lại danh sách trước khi thử lại.':
    'The license assignment result was not confirmed. Reload the list before retrying.',
  'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.':
    'The sign-in session has expired. Please sign in again.',
  'Bạn không có quyền thực hiện thao tác này.': 'You are not allowed to perform this action.',
  'Có quá nhiều yêu cầu. Vui lòng thử lại sau.': 'Too many requests. Please try again later.',
  'Gói dịch vụ hiện tại không cho phép thao tác. Vui lòng kiểm tra với quản trị viên.':
    'The current license does not allow this action. Please check with an administrator.',
  'Không thể thực hiện. Kiểm tra mã kích hoạt chưa dùng, thời hạn và số suất còn lại trong kho.':
    'Could not complete. Check that the key is unused, its validity and the remaining seats in the pool.',
  'Chưa xác nhận được kết quả. Kiểm tra trạng thái với quản trị viên trước khi thử lại.':
    'The result was not confirmed. Check the status with an administrator before retrying.',
  'Ghi chú tối đa 500 ký tự.': 'The note can be at most 500 characters.',
  'Kho đã hết suất hoặc không còn hiệu lực. Kiểm tra gói Business trước khi tạo mã kích hoạt.':
    'The pool is out of seats or no longer valid. Check the Business plan before creating a key.',
  'Chưa đọc được mã kích hoạt đã tạo. Không tạo lại; liên hệ quản trị viên để kiểm tra kết quả.':
    'Could not read the created key. Do not create another; contact an administrator to check the result.',
  'Chỉ người chăm sóc gia đình được kích hoạt mã tại đây.':
    'Only family caregivers can activate keys here.',
  'Nhập mã kích hoạt hợp lệ, tối đa 100 ký tự.': 'Enter a valid key of at most 100 characters.',
  'Chưa xác nhận được gói dịch vụ đã kích hoạt. Tải lại thông tin trước khi thử lại.':
    'The license activation was not confirmed. Reload the information before retrying.',
  'Dùng thử': 'Trial',
  'Đã hết hạn': 'Expired',
  'Chưa có gói dịch vụ': 'No license',
  'Dữ liệu kho suất sử dụng không hợp lệ. Hãy tải lại.':
    'Invalid license pool data. Please reload.',
  'Máy chủ trả về kho suất sử dụng không thuộc tổ chức của bạn.':
    'The server returned a license pool that does not belong to your organization.',
  'Tài khoản không dùng gói dịch vụ cá nhân.': 'The account does not use a personal subscription.',
  'Dữ liệu gói dịch vụ không hợp lệ. Hãy tải lại.': 'Invalid subscription data. Please reload.',
  'Nhân viên thuộc tổ chức nên không yêu cầu gói dịch vụ cá nhân. Quyền dữ liệu vẫn theo phân công.':
    'Organization staff need no personal license. Data access still follows the assignment.',
  'Tài khoản quản trị không yêu cầu gói dịch vụ cá nhân.':
    'Administrator accounts need no personal license.',
  'Đang dùng thử{p0}.': 'On trial{p0}.',
  'Gói dịch vụ đang hoạt động theo trạng thái máy chủ.':
    'The license is active according to the server status.',
  'Gói dịch vụ đã hết hạn, máy chủ báo còn {days} ngày gia hạn. Gia hạn trước khi các chức năng bị khóa.':
    'The license has expired; the server reports {days} grace days left. Renew before features are locked.',
  'Gói dịch vụ đã hết hạn và quá thời gian gia hạn. Gia hạn để dùng lại các chức năng.':
    'The license has expired and its grace period is over. Renew to use these features again.',
  'Gói dịch vụ đã hết hạn. Một số chức năng có thể bị giới hạn; kiểm tra thông tin gia hạn.':
    'The license has expired. Some features may be limited; check the renewal information.',
  'Chưa có gói dịch vụ cá nhân. Kiểm tra gói dịch vụ hoặc thông tin kích hoạt.':
    'No personal license yet. Check the subscription or activation information.',
  'Chưa xác định được trạng thái gói dịch vụ từ máy chủ. Hãy tải lại thông tin.':
    'The license status from the server could not be determined. Please reload the information.',
  'Mã hoặc dữ liệu liên kết không hợp lệ.': 'Invalid link ID or data.',
  'Phản hồi liên kết không hợp lệ.': 'Invalid link response.',
  'Không có quyền quản lý liên kết.': 'You are not allowed to manage links.',
  'Màn phân công trung tâm chỉ quản lý liên kết tổ chức.':
    'The center assignment screen only manages organization links.',
  'Sai tài khoản người chăm sóc hoặc người khiếm thị.': 'Wrong Caregiver or VIU account.',
  'Hai tài khoản phải thuộc tổ chức của bạn.': 'Both accounts must belong to your organization.',
  'Liên kết tổ chức yêu cầu hai tài khoản cùng tổ chức.':
    'Organization links require both accounts to be in the same organization.',
  'Hai tài khoản phải hoạt động và chưa bị xóa.': 'Both accounts must be active and not deleted.',
  'Liên kết trả về không khớp lựa chọn.': 'The returned link does not match the selection.',
  'Không thể sửa liên kết đã gỡ hoặc ngoài quyền của bạn.':
    'Cannot edit a removed link or one outside your permissions.',
  'Không thể liên kết với chính mình.': 'You cannot link to yourself.',
  'Kết quả không khớp phân công; hãy tải lại để xác minh.':
    'The result does not match the assignment; reload to verify.',
  'Chỉ quản trị viên được chuyển người chăm sóc chính.':
    'Only administrators can transfer the primary caregiver.',
  'Liên kết đã là chăm sóc chính; hãy tải lại.': 'The link is already primary care; please reload.',
  'Dữ liệu GPS từ máy chủ không hợp lệ.': 'GPS data from the server is invalid.',
  'Không có quyền xem vị trí.': 'You are not allowed to view locations.',
  'Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.':
    'The end time must be after or equal to the start time.',
  'Cần kiểm tra thời gian thiết bị': 'Check the device time',
  'Dữ liệu cũ hơn 2 phút': 'Data older than 2 minutes',
  'Ghi nhận trong 2 phút gần đây': 'Recorded in the last 2 minutes',
  'Vị trí không thuộc người khiếm thị được chọn.':
    'The location does not belong to the selected VIU.',
  'Dữ liệu giám sát từ máy chủ không hợp lệ.': 'Monitoring data from the server is invalid.',
  'Khoảng ngày không hợp lệ. Kiểm tra ngày bắt đầu và kết thúc.':
    'Invalid date range. Check the start and end dates.',
  'Bộ lọc không hợp lệ.': 'Invalid filter.',
  'Phát hiện té ngã': 'Fall detection',
  'Khẩn cấp chủ động': 'Manual emergency',
  'Vượt vùng an toàn': 'Safe zone breach',
  'Thông báo đến nơi': 'Arrival notification',
  'Thông báo hệ thống': 'System notification',
  'Dữ liệu thông báo không hợp lệ. Kiểm tra các trường và tải lại.':
    'Invalid notification data. Check the fields and reload.',
  'Không có quyền quản lý quy tắc.': 'You are not allowed to manage rules.',
  'Tùy chọn không thuộc tài khoản hiện tại.':
    'The preference does not belong to the current account.',
  'Quy tắc không thuộc trung tâm hiện tại.': 'The rule does not belong to the current center.',
  'Phạm vi quy tắc trả về không khớp.': 'The returned rule scope does not match.',
  'Chỉ được sửa quy tắc của trung tâm mình.': "You can only edit your own center's rules.",
  'Quy tắc trả về không khớp.': 'The returned rule does not match.',
  'Chỉ được xóa quy tắc của trung tâm mình.': "You can only delete your own center's rules.",
  'Dữ liệu tổ chức không đúng định dạng.': 'Organization data has an invalid format.',
  'Bạn không có quyền thao tác tổ chức này.': 'You are not allowed to act on this organization.',
  'Mã tổ chức không hợp lệ.': 'Invalid organization ID.',
  'Tên tổ chức từ 1 đến 200 ký tự.': 'The organization name must be 1 to 200 characters.',
  'Địa chỉ tối đa 500 ký tự.': 'The address can be at most 500 characters.',
  'Nhập số di động (03, 05, 07, 08, 09), số bàn 02x hoặc tổng đài 1800/1900.':
    'Enter a mobile number (03, 05, 07, 08, 09), a 02x landline or a 1800/1900 number.',
  'Mã số thuế tối đa 50 ký tự.': 'The tax code can be at most 50 characters.',
  'Kiểm tra ngày lọc; ngày kết thúc phải sau hoặc bằng ngày bắt đầu.':
    'Check the filter dates; the end date must be after or equal to the start date.',
  'Báo cáo không thuộc tổ chức hiện tại.':
    'The report does not belong to the current organization.',
  'Khoảng ngày báo cáo không khớp bộ lọc.': 'The report date range does not match the filter.',
  'Tổ chức trả về không khớp lựa chọn.': 'The returned organization does not match the selection.',
  'Chỉ dành cho quản trị trung tâm.': 'For center administrators only.',
  'Tổ chức không thuộc phiên hiện tại.': 'The organization does not belong to the current session.',
  'Giá có tối đa 2 chữ số thập phân.': 'Prices can have at most 2 decimal places.',
  'Giá năm phải lớn hơn 0.': 'The yearly price must be greater than 0.',
  'Bạn không có quyền quản lý gói này.': 'You are not allowed to manage this plan.',
  'Mã gói không hợp lệ.': 'Invalid plan code.',
  'Dữ liệu gói không hợp lệ. Hãy tải lại.': 'Invalid plan data. Please reload.',
  'Danh sách tính năng cần đúng định dạng, mỗi giá trị là true hoặc false.':
    'Feature flags must be JSON with true/false values.',
  'Kiểm tra thông tin gói: giá hợp lệ, số lượng/ngày là số nguyên và danh sách tính năng chỉ chứa true/false.':
    'Check the plan details: a valid price, whole numbers for quantities/days and flags containing only true/false.',
  'Máy chủ trả về sai gói.': 'The server returned the wrong plan.',
  'Máy chủ trả về sai gói. Tải lại trước khi thao tác tiếp.':
    'The server returned the wrong plan. Reload before continuing.',
  'Đang chờ thanh toán': 'Awaiting payment',
  'Thanh toán thành công': 'Payment successful',
  'Thanh toán thất bại': 'Payment failed',
  'Đã hoàn tiền': 'Refunded',
  'Dữ liệu thanh toán không hợp lệ. Kiểm tra lịch sử trước khi tạo giao dịch khác.':
    'Invalid payment data. Check the history before creating another transaction.',
  'Tài khoản không có quyền thanh toán gói dịch vụ.':
    'The account is not allowed to pay for service plans.',
  'Mã đơn thanh toán không hợp lệ.': 'Invalid payment order code.',
  'Chưa tìm thấy giao dịch trong 1.000 bản ghi gần nhất. Kiểm tra lịch sử hoặc liên hệ hỗ trợ.':
    'The transaction was not found in the 1,000 most recent records. Check the history or contact support.',
  'Gói không phù hợp với tài khoản hoặc chưa hỗ trợ thanh toán bằng VND nguyên dương.':
    'The plan does not suit the account or does not support payment in positive whole VND yet.',
  'Địa chỉ Web thanh toán không hợp lệ.': 'Invalid payment Web address.',
  'Gói đã thay đổi hoặc ngừng mở. Đóng hộp thoại và tải lại danh mục để kiểm tra.':
    'The plan has changed or is closed. Close the dialog and reload the catalog to check.',
  'Liên kết thanh toán không thuộc PayOS được hỗ trợ. Kiểm tra lịch sử; không tạo lại giao dịch ngay.':
    'The payment link is not a supported PayOS link. Check the history; do not create a new transaction right away.',
  'Không tìm thấy giao dịch của tài khoản này.': 'No transaction found for this account.',
  'Trạng thái giao dịch đã thay đổi. Hãy tải lại.':
    'The transaction status has changed. Please reload.',
  'Mã địa điểm hoặc người được chăm sóc không hợp lệ.': 'Invalid place or care recipient ID.',
  'Bạn không có quyền mở màn hình này.': 'You are not allowed to open this screen.',
  'Bạn không còn liên kết hoặc quyền quản lý vị trí cho người này.':
    'You no longer have a link or location management permission for this person.',
  'Dữ liệu địa điểm từ máy chủ không hợp lệ.': 'Place data from the server is invalid.',
  'Địa điểm không thuộc người được chọn.': 'The place does not belong to the selected person.',
  'Bộ lọc địa điểm không hợp lệ.': 'Invalid place filter.',
  'Danh sách địa điểm không hợp lệ.': 'Invalid place list.',
  'Mã đăng ký thông báo không hợp lệ.': 'Invalid notification token.',
  'Ảnh phải có dữ liệu và không vượt quá 10 MB.':
    'The photo must contain data and be at most 10 MB.',
  'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP hợp lệ.':
    'Only valid JPEG, PNG or WebP images are supported.',
  'Mã người hoặc ảnh không hợp lệ.': 'Invalid person or photo ID.',
  'Bạn không có quyền mở danh bạ này.': 'You are not allowed to open this registry.',
  'Bạn không còn liên kết hoặc quyền quản lý gương mặt cho người này.':
    'You no longer have a link or face management permission for this person.',
  'Dữ liệu danh bạ từ máy chủ không hợp lệ.': 'Registry data from the server is invalid.',
  'Người hoặc ảnh không thuộc danh bạ được chọn.':
    'The person or photo does not belong to the selected registry.',
  'Ảnh không còn thuộc người được chọn. Hãy tải lại.':
    'The photo no longer belongs to the selected person. Please reload.',
  'Danh sách gương mặt không hợp lệ.': 'Invalid face list.',
  'Kiểm tra tên, mối quan hệ và ghi chú.': 'Check the name, relationship and notes.',
  'Tệp vượt quá giới hạn tải lên của máy chủ.': 'The file exceeds the server upload limit.',
  'Máy chủ phản hồi quá thời gian chờ. Kiểm tra mạng rồi thử lại.':
    'The server took too long to respond. Check your connection and try again.',
  'Ảnh không được vượt quá 10 MB.': 'The photo must not exceed 10 MB.',
  'Thiếu người cần thêm ảnh. Tải lại trang rồi thử lại.':
    'The person for this photo is missing. Reload the page and try again.',
  'Ảnh vượt quá giới hạn tải lên của máy chủ (tối đa 10 MB).':
    'The photo exceeds the server upload limit (10 MB max).',
  'Tải ảnh quá thời gian chờ. Kiểm tra mạng rồi thử lại.':
    'The photo upload timed out. Check your connection and try again.',
  'Không gửi được ảnh. Có thể ảnh quá lớn hoặc mạng không ổn định.':
    'The photo could not be sent. It may be too large or the connection is unstable.',
  'Không nhận được ảnh từ máy chủ.': 'No photo received from the server.',
  'Không tìm thấy gương mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.':
    'No face found in the photo. Choose a clear, well-lit photo with only one person.',
  'Kết quả tải ảnh không hợp lệ. Tải lại trước khi gửi lại.':
    'Invalid upload result. Reload before resubmitting.',
  'Kết quả đổi ảnh chính không hợp lệ. Hãy tải lại.':
    'Invalid primary photo change result. Please reload.',
  'Cấu hình giọng đọc từ máy chủ không hợp lệ.':
    'The voice configuration from the server is invalid.',
  'Cấu hình không thuộc người được chọn.':
    'The configuration does not belong to the selected person.',
  'Không xác minh được người được chăm sóc đang hoạt động.':
    'Could not verify an active care recipient.',
  'Kiểm tra giọng đọc, tốc độ, âm lượng và ngôn ngữ.':
    'Check the voice, speed, volume and language.',
  'Email này đã được đăng ký. Dùng email khác hoặc đăng nhập.':
    'This email is already registered. Use another email or sign in.',
  'Cần chọn tổ chức cho tài khoản không phải quản trị hệ thống.':
    'An organization is required for accounts that are not system administrators.',
  'Tài khoản đang bị vô hiệu hóa.': 'The account is deactivated.',
  'Tài khoản đã bị xóa.': 'The account has been deleted.',
  'Tài khoản đã ở trạng thái này.': 'The account is already in this status.',
  'Vai trò tài khoản không phù hợp với thao tác này.':
    'The account role does not suit this action.',
  'Không thể tự xóa tài khoản của mình.': 'You cannot delete your own account.',
  'Không thể tự vô hiệu hóa tài khoản của mình.': 'You cannot deactivate your own account.',
  'Tổ chức đã ở trạng thái này.': 'The organization is already in this status.',
  'Các tài khoản không cùng tổ chức.': 'The accounts are not in the same organization.',
  'Liên kết tổ chức cần hai tài khoản thuộc cùng một tổ chức.':
    'Organization links require both accounts to belong to the same organization.',
  'Mã số thuế đã được dùng cho tổ chức khác.':
    'The tax code is already used by another organization.',
  'Hai tài khoản này đã có liên kết đang hoạt động.':
    'These two accounts already have an active link.',
  'Không thể liên kết một tài khoản với chính nó.': 'An account cannot be linked to itself.',
  'Liên kết này đã là người chăm sóc chính.': 'This link is already the primary caregiver.',
  'Người được chăm sóc đã đủ 3 người chăm sóc.': 'The care recipient already has 3 caregivers.',
  'Bạn đã có tối đa 3 người được chăm sóc.': 'You already have the maximum of 3 care recipients.',
  'Người được chăm sóc chưa có người chăm sóc chính.':
    'The care recipient has no primary caregiver yet.',
  'Cần chọn người chăm sóc.': 'A caregiver must be selected.',
  'Cần chọn người được chăm sóc.': 'A care recipient must be selected.',
  'Thứ tự ưu tiên đã được dùng cho liên hệ khác. Chọn số khác.':
    'The priority order is already used by another contact. Choose another number.',
  'Liên hệ đã ở trạng thái này.': 'The contact is already in this status.',
  'Đã đủ 5 liên hệ khẩn cấp. Xóa bớt trước khi thêm.':
    'There are already 5 emergency contacts. Delete one before adding.',
  'Cần nhập số điện thoại cho loại liên hệ này.':
    'A phone number is required for this contact type.',
  'Cần nhập liên kết Zalo cho loại liên hệ này.': 'A Zalo link is required for this contact type.',
  'Đã đủ 20 địa điểm. Xóa bớt trước khi thêm.':
    'There are already 20 places. Delete one before adding.',
  'Danh bạ gương mặt đã đủ 20 người.': 'The face registry already has 20 people.',
  'Dịch vụ nhận diện gương mặt tạm thời không hoạt động. Thử lại sau.':
    'The face recognition service is temporarily unavailable. Try again later.',
  'Chỉ nhận ảnh JPEG, PNG hoặc WebP.': 'Only JPEG, PNG or WebP images are accepted.',
  'Nội dung tệp không khớp định dạng ảnh đã chọn.':
    'The file content does not match the selected image format.',
  'Ảnh quá nhỏ để nhận diện. Chọn ảnh có độ phân giải cao hơn.':
    'The photo is too small for recognition. Choose a higher-resolution photo.',
  'Tài khoản của bạn chưa có gói dịch vụ nên không bắt đầu được cuộc gọi mới. Cảnh báo và cuộc gọi SOS vẫn hoạt động. Mở mục Gói dịch vụ để chọn gói hoặc kích hoạt mã.':
    'Your account has no license, so new calls cannot be started. Alerts and SOS calls still work. Open License to choose a plan or activate a key.',
  'Gói dịch vụ của bạn đã hết hạn và quá thời gian gia hạn nên không bắt đầu được cuộc gọi mới. Cảnh báo và cuộc gọi SOS vẫn hoạt động. Mở mục Gói dịch vụ để gia hạn.':
    'Your license has expired and its grace period is over, so new calls cannot be started. Alerts and SOS calls still work. Open License to renew.',
  'Người được chăm sóc chưa có gói dịch vụ nên không gọi video được. Cuộc gọi SOS từ họ vẫn hoạt động. Kích hoạt gói để gọi.':
    'The care recipient has no license, so a video call cannot be started. SOS calls from them still work. Activate a plan to call.',
  'Gói dịch vụ của người được chăm sóc đã hết hạn và quá thời gian gia hạn nên không gọi video được. Cuộc gọi SOS từ họ vẫn hoạt động. Gia hạn để gọi.':
    'The care recipient’s license has expired and its grace period is over, so a video call cannot be started. SOS calls from them still work. Renew to call.',
  'Báo cáo doanh thu': 'Revenue report',
  'Báo cáo theo ngày tối đa 366 ngày. Chọn khoảng ngắn hơn hoặc xem theo tháng.':
    'Daily reports cover at most 366 days. Choose a shorter range or view by month.',
  'Báo cáo theo tháng tối đa 5 năm.': 'Monthly reports cover at most 5 years.',
  'Chỉ quản trị hệ thống được xem báo cáo doanh thu.':
    'Only system admins can view the revenue report.',
  'Doanh thu': 'Revenue',
  'Doanh thu gộp': 'Gross revenue',
  'Doanh thu ròng': 'Net revenue',
  'Doanh thu theo ngày': 'Revenue by day',
  'Doanh thu theo tháng': 'Revenue by month',
  'Dữ liệu báo cáo doanh thu từ máy chủ không hợp lệ.':
    'The revenue report data from the server is invalid.',
  'Gia đình (B2C)': 'Families (B2C)',
  'Giao dịch': 'Transactions',
  'Giao dịch chưa thu tiền': 'Unpaid transactions',
  'Giao dịch đã thanh toán': 'Paid transactions',
  'Hoàn tiền': 'Refund',
  'Khách hàng trả tiền': 'Paying customers',
  'Không có dữ liệu trong kỳ.': 'No data in this period.',
  'Kỳ báo cáo: {from} → {to}': 'Report period: {from} → {to}',
  'Loại giao dịch': 'Transaction type',
  'Mua gói Business': 'Business plan purchase',
  'Mua gói Personal': 'Personal plan purchase',
  'Mua thêm suất sử dụng Business': 'Business license top-up',
  'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.':
    'The start date must be on or before the end date.',
  'Ngày không hợp lệ.': 'Invalid date.',
  'Theo gói': 'By plan',
  'Theo kênh': 'By channel',
  'Theo loại giao dịch': 'By transaction type',
  Tháng: 'Month',
  'Trung tâm (B2B)': 'Centers (B2B)',
  'Trung tâm có doanh thu cao nhất': 'Top centers by revenue',
  'Xem theo': 'Group by',
  'trung bình {value}/đơn': 'average {value} per order',
  '{caregivers} người chăm sóc · {organizations} trung tâm':
    '{caregivers} caregivers · {organizations} centers',
  '{pending} đang chờ · {failed} thất bại · {cancelled} đã hủy':
    '{pending} pending · {failed} failed · {cancelled} cancelled',
  'Buộc đăng xuất tài khoản': 'Account forced logout',
  'Bộ lọc': 'Filters',
  'Cập nhật tổ chức': 'Organization updated',
  'Gỡ người dùng khỏi tổ chức': 'User removed from organization',
  'Hệ thống dọn dữ liệu GPS': 'System GPS cleanup',
  'Hệ thống dọn dữ liệu đọc chữ': 'System OCR cleanup',
  'Hệ thống dọn phiên đăng nhập': 'System token cleanup',
  'Hệ thống dọn ảnh cảnh báo': 'System alert image cleanup',
  'Hệ thống dọn ảnh gương mặt': 'System face image cleanup',
  'Kích hoạt lại tài khoản': 'Account reactivated',
  'Thêm người dùng vào tổ chức': 'User added to organization',
  'Truy cập dữ liệu GPS': 'GPS data accessed',
  'Tạo liên kết chăm sóc': 'Care link created',
  'Xóa dữ liệu gương mặt': 'Face data deleted',
  'Xóa điều kiện': 'Clear filters',
  '{count} điều kiện': '{count} filters',
  'Đình chỉ kho suất sử dụng': 'License pool suspended',
  'Đổi cấu hình hệ thống': 'System configuration changed',
  'Đổi vai trò': 'Role changed',
  'Cảnh báo của người bạn được phép theo dõi, tự cập nhật theo thời gian thực.':
    'Alerts for people you may monitor, updated in real time.',
  'Danh bạ khẩn cấp của người được chăm sóc. Lưu liên hệ không thực hiện cuộc gọi.':
    'Emergency contacts of the care recipient. Saving a contact does not place a call.',
  'Doanh thu từ các đơn đã thanh toán qua PayOS, chia theo gia đình hay trung tâm, theo gói và theo từng trung tâm.':
    'Revenue from paid PayOS transactions by channel, plan and center.',
  'Hồ sơ và trạng thái tài khoản trong phạm vi của bạn.':
    'Account profiles and status within your scope.',
  'Ai đã làm gì và vào lúc nào trên hệ thống. Chỉ xem, không sửa được.':
    'Who did what and when on the system. The log is read-only.',
  'Chọn giọng, tốc độ và âm lượng đọc trên điện thoại của người được chăm sóc.':
    "Choose the voice, speed and volume used on the care recipient's phone.",
  'Các chỉ dẫn tránh vật cản đã đọc cho người khiếm thị và thời gian phản hồi.':
    'Navigation guidance the AI gave and how long it took.',
  'Các cuộc gọi bạn đã thực hiện hoặc nhận.': 'Calls you made or received.',
  'Các đơn thanh toán gói dịch vụ của bạn.': 'Your plan payment orders.',
  'Danh sách trung tâm, thành viên và kho suất sử dụng của từng trung tâm.':
    "Centers, their members and each center's license pool.",
  'Gán người chăm sóc cho người khiếm thị và chỉnh quyền của từng liên kết.':
    "Assign caregivers to visually impaired users and set each link's permissions.",
  'Hai tài khoản phải đang hoạt động; liên kết tổ chức cần cùng một trung tâm. Mỗi người khiếm thị có tối đa {maxCaregivers} người chăm sóc, mỗi người chăm sóc theo dõi tối đa {maxVius} người.':
    'Both accounts must be active; an organization link needs the same center. Each visually impaired user has at most {maxCaregivers} caregivers, and each caregiver follows at most {maxVius} people.',
  'Máy chủ trung gian giúp cuộc gọi video giữa điện thoại và trang web vẫn kết nối được khi mạng hai bên khác nhau hoặc bị chặn.':
    'STUN/TURN servers help video calls connect across networks.',
  'Những người cùng chăm sóc và quyền của từng người.':
    "People who share the care and each one's permissions.",
  'Số gói dịch vụ đã mua, đã cấp và thời hạn sử dụng của trung tâm.':
    "Licenses bought, assigned and the center's validity period.",
  'Mỗi ngày AI đã nhận diện bao nhiêu lần, mất bao lâu và chắc chắn đến mức nào.':
    'Daily processing count, time and confidence for each AI model.',
  'Thông tin liên hệ và thành viên của trung tâm.': "The center's contact details and members.",
  'Tạo gói, đặt giá và mở bán hoặc ngừng bán.':
    'Create plans, set prices and start or stop selling them.',
  'Xem và chỉnh các thiết lập chung của hệ thống; có thể quay lại giá trị trước đó.':
    "View, adjust and restore the system's operating settings.",
  'Mã kích hoạt không hợp lệ, đã được kích hoạt hoặc đã hết hạn.':
    'The key is invalid, already activated or expired.',
  'Mã kích hoạt đã hết hạn.': 'The key has expired.',
  'Kho suất sử dụng đã hết suất. Mua thêm gói Business.':
    'The license pool is out of seats. Buy another Business plan.',
  'Kho suất sử dụng không còn hiệu lực. Kiểm tra gói Business.':
    'The license pool is no longer valid. Check the Business plan.',
  'Tổ chức chưa có kho suất sử dụng. Mua gói Business trước.':
    'The organization has no license pool yet. Buy a Business plan first.',
  'Người này đã được cấp suất sử dụng.': 'This person already has a license.',
  'Đã quá thời gian gia hạn. Vui lòng mua hoặc gia hạn gói.':
    'The grace period is over. Please buy or renew a plan.',
  'Loại gói không phù hợp với tài khoản.': 'The plan type does not suit the account.',
  'Giá gói không hợp lệ.': 'Invalid plan price.',
  'Mã gói đã tồn tại.': 'The plan code already exists.',
  'Giao dịch này không thể hủy nữa.': 'This transaction can no longer be cancelled.',
  'Cảnh báo đã đổi trạng thái. Tải lại để xem trạng thái mới.':
    'The alert status has changed. Reload to see the new status.',
  'Cảnh báo này không còn đang xử lý.': 'This alert is no longer being handled.',
  'Cuộc gọi đã kết thúc hoặc đổi trạng thái.': 'The call has ended or changed status.',
  'Cuộc gọi đã kết thúc.': 'The call has ended.',
  'Tính năng gọi đang tắt trên hệ thống.': 'Calling is turned off in the system.',
  'Đã có quy tắc cho loại thông báo, kênh và vai trò này.':
    'A rule already exists for this notification type, channel and role.',
  'Giá trị cấu hình không hợp lệ.': 'Invalid configuration value.',
  'Dòng lịch sử này không có giá trị trước để khôi phục.':
    'This history row has no previous value to restore.',
  'Loại máy chủ kết nối không hợp lệ.': 'Invalid connection server type.',
  'Máy chủ trả về dữ liệu không đúng định dạng.': 'Invalid JSON response from the server.',
  'Máy chủ yêu cầu kiểm tra gói dịch vụ cho thao tác này. Phiên đăng nhập vẫn được giữ. Mở mục Gói dịch vụ để xem trạng thái hoặc tải lại sau khi gói dịch vụ được cập nhật.':
    'The server requires a license check for this action. Your session is kept. Open License to see the status, or reload after the license is updated.',
  'Máy chủ đang gặp sự cố. Vui lòng tải lại dữ liệu để kiểm tra kết quả trước khi thử lại.':
    'The server is having problems. Please reload the data to check the result before retrying.',
  'Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây.':
    'You are acting too fast. Please try again in {seconds} seconds.',
  'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.':
    'You are acting too fast. Please wait a moment and try again.',
  'Trình duyệt không hỗ trợ thông báo.': 'The browser does not support notifications.',
  'Đã cấp quyền trình duyệt. Dịch vụ thông báo chưa được cấu hình nên chưa nhận được thông báo thật.':
    'Browser permission granted. FCM/token registration is not configured; no real push is received yet.',
  'Bạn đã từ chối thông báo. Trang quản lý vẫn hoạt động; có thể đổi trong cài đặt trình duyệt.':
    'You declined notifications. The Dashboard still works; you can change this in the browser settings.',
  'Chưa cấp quyền thông báo.': 'Notification permission not granted yet.',
  'Trình duyệt này chưa hỗ trợ thông báo.': 'The browser does not support Web Push yet.',
  'Chưa tắt được thông báo đẩy. Hãy chặn thông báo trong cài đặt trình duyệt.':
    'Could not turn off push. Block notifications in the browser settings.',
  'Thông báo trên trình duyệt cần trang web bảo mật (https) và trình duyệt có hỗ trợ.':
    'Web Push requires HTTPS and a browser that supports notifications.',
  'Chưa được cấp quyền thông báo. Bạn vẫn có thể dùng trang quản lý.':
    'Notification permission has not been granted. You can still use the Dashboard.',
  'Phiên đã thay đổi. Vui lòng thử lại.': 'The session has changed. Please try again.',
  'Phiên đã thay đổi.': 'The session has changed.',
  'Trình duyệt không hỗ trợ đọc ảnh QR. Hãy nhập mã thủ công.':
    'The browser cannot read QR images. Enter the code manually.',
  'Không tìm thấy mã liên kết VisionAid demo hợp lệ trong ảnh.':
    'No valid VisionAid demo link code found in the image.',
  'Trình duyệt chưa hỗ trợ khóa cuộc gọi. Hãy dùng Chrome hoặc Edge mới.':
    'The browser does not support call locks yet. Use a recent Chrome or Edge.',
  'Cuộc gọi đang được xử lý ở tab khác.': 'The call is being handled in another tab.',
  'Đã kết thúc cuộc gọi.': 'Call ended.',
  ' Chưa xác nhận kết thúc trên máy chủ. Kiểm tra lại lịch sử.':
    ' Ending was not confirmed on the server. Check the history.',
  'Không thể kết nối âm thanh hoặc hình ảnh. Hãy thử gọi lại.':
    'Could not connect audio or video. Try calling again.',
  'Cuộc gọi SOS đến. Chọn nhận để bật micro.':
    'Incoming SOS call. Choose answer to turn on the microphone.',
  'Người được chăm sóc gọi bằng giọng nói. Chọn nhận để bật micro.':
    'The care recipient is calling by voice. Choose answer to turn on the microphone.',
  'Cuộc gọi đến. Chọn nhận để bật micro.':
    'Incoming call. Choose answer to turn on the microphone.',
  'Không còn xác minh được phiên gọi.': 'The call session could no longer be verified.',
  'Cuộc gọi không được trả lời.': 'The call was not answered.',
  'Cuộc gọi đã bị từ chối.': 'The call was declined.',
  'Cuộc gọi đã được nhận trên thiết bị khác.': 'The call was answered on another device.',
  'Âm thanh và hình ảnh đã kết nối.': 'Audio and video connected.',
  'Không thể xác minh quyền hoặc trạng thái cuộc gọi.':
    "Could not verify the call's permission or status.",
  'Cuộc gọi đến đã đóng. Xem lịch sử để kiểm tra trạng thái.':
    'The incoming call was closed. See the history to check the status.',
  'Chờ kết nối quá lâu. Hãy thử gọi lại.': 'Waited too long to connect. Try calling again.',
  'Không tìm thấy micro hoạt động.': 'No working microphone found.',
  'Micro đã ngắt kết nối.': 'The microphone was disconnected.',
  'Đã chấp nhận, đang chờ âm thanh và hình ảnh…': 'Accepted, waiting for audio and video…',
  'Đang xin quyền micro…': 'Requesting microphone permission…',
  'Đang tạo kết nối…': 'Creating connection…',
  'Đang chờ âm thanh và hình ảnh…': 'Waiting for audio and video…',
  'Đang đổ chuông…': 'Ringing…',
  'Bạn chưa cho phép micro. Hãy cấp quyền rồi thử lại.':
    'You have not allowed the microphone. Grant permission and try again.',
  'Không thể bắt đầu cuộc gọi.': 'Could not start the call.',
  'Mất kết nối cuộc gọi. Micro đã tắt; hãy gọi lại khi mạng ổn định.':
    'Call connection lost. The microphone is off; call again when the network is stable.',
  'Đã đóng cuộc gọi đến.': 'Incoming call closed.',
  'Chưa xác nhận từ chối trên máy chủ. Kiểm tra lại lịch sử.':
    'Declining was not confirmed on the server. Check the history.',
  'Ngôn ngữ giao diện': 'Interface language',
  Xa: 'Far',
  'Chi tiết {kind}': '{kind} details',
  'Giá trị tối thiểu {min}.': 'Minimum value {min}.',
  'Giá trị tối đa {max}.': 'Maximum value {max}.',
  'Tối đa {max} ký tự.': 'At most {max} characters.',
  Nam: 'Male',
  'Bạn sẽ không còn quyền quản lý người chăm sóc phụ.':
    'You will no longer be able to manage secondary caregivers.',
  'Vùng này sẽ không còn được dùng để cảnh báo vào hoặc ra.':
    'This zone will no longer be used for enter or exit alerts.',
  'Địa điểm này sẽ không còn được dùng để nhắc khi đến nơi.':
    'This place will no longer be used for arrival reminders.',
  'Không có ghi chú.': 'No notes.',
  ' · Còn {days} ngày theo thời hạn hồ sơ': ' · {days} days left according to the profile expiry',
  'Không thể tạo tài khoản.': 'Could not create the account.',
  'Trang {page}/{total}': 'Page {page}/{total}',
  Pin: 'Battery',
  'Trang sau': 'Next page',
  'VisionAid · Đồng hành an tâm': 'VisionAid · Care with peace of mind',
  'Chỉ quản trị hệ thống được tạm ngưng hoặc kích hoạt lại kho suất sử dụng.':
    'Only system administrators can suspend or reactivate a license pool.',
  'Kho suất sử dụng không hợp lệ. Hãy tải lại.': 'Invalid license pool. Please reload.',
  'Chưa ghi nhận': 'Not recorded',
  'Bản đồ vị trí; danh sách tương đương ở bảng bên dưới':
    'Location map; the equivalent list is in the table below',
  'Chưa cấu hình VITE_MAPBOX_PUBLIC_TOKEN nên chưa hiển thị bản đồ; dữ liệu tọa độ ở bảng bên dưới.':
    'VITE_MAPBOX_PUBLIC_TOKEN is not configured, so no map is shown; coordinates are in the table below.',
  'Không hiển thị được bản đồ. Dữ liệu tọa độ vẫn ở bảng bên dưới.':
    'The map could not be shown. Coordinates are still in the table below.',
  'Không tải được bản đồ Mapbox ({p1}). Dữ liệu tọa độ vẫn ở bảng bên dưới.':
    'Could not load the Mapbox map ({p1}). Coordinates are still in the table below.',
  'Trình duyệt không hỗ trợ WebGL nên không hiển thị được bản đồ.':
    'This browser does not support WebGL, so the map cannot be shown.',
  'lỗi mạng': 'network error',
  '{name} · {state}': '{name} · {state}',
  'Đang tải bản đồ…': 'Loading map…',
  'Bản đồ': 'Map',
  'Ghi nhận GPS: {time}': 'GPS recorded: {time}',
  'Bạn là người chăm sóc phụ: quyền của liên kết do người chăm sóc chính quyết định. Bạn chỉ có thể tự hủy liên kết.':
    'You are a secondary caregiver: the primary caregiver decides this link’s permissions. You can only cancel your own link.',
  'Chỉ xác nhận khi bạn đã thực sự gọi cho người được chăm sóc, người thân hoặc 115; Web không tự gọi. Sau khi xác nhận, cảnh báo kết thúc ở trạng thái Đã gọi và không chuyển sang Đã giải quyết được nữa. {p1}':
    'Confirm only after you have actually called the care recipient, a relative or 115; the Web never calls. After confirming, the alert ends as Called and can no longer be marked Resolved. {p1}',
  'Chỉ được xem liên kết của bạn hoặc của người bạn chăm sóc chính.':
    'You can only view your own links or those of people you are primary caregiver for.',
  'Hủy liên kết của tôi': 'Cancel my link',
  'Xác nhận đã gọi hỗ trợ': 'Confirm help was called',
  'Chỉ người chăm sóc cá nhân được hủy gói của mình.':
    'Only personal caregivers can cancel their own plan.',
  'Gói này được kích hoạt bằng mã kích hoạt của trung tâm nên không tự hủy được. Hãy liên hệ quản trị trung tâm.':
    'This plan was activated with a center key, so you cannot cancel it yourself. Please contact the center administrator.',
  'Hủy gia hạn gói': 'Cancel plan renewal',
  'Hủy gia hạn gói {name}? Bạn vẫn dùng được tới hết kỳ hiện tại ({date}); sau đó gói không tự gia hạn.':
    'Cancel renewal of the {name} plan? You can keep using it until the end of the current period ({date}); after that the plan will not renew.',
  'Hủy gia hạn': 'Cancel renewal',
  'Đã hủy gia hạn, còn dùng đến {date}.': 'Renewal cancelled. Access remains until {date}.',
  'Đã hủy gia hạn, còn dùng đến {date}. Sau đó gói không tự gia hạn; bạn có thể mua lại từ danh mục gói.':
    'Renewal cancelled. Access remains until {date}. The plan will not renew after that; you can buy it again from the plan catalog.',
  'Gói này được kích hoạt bằng mã kích hoạt của trung tâm. Liên hệ quản trị trung tâm để thay đổi.':
    'This plan was activated with a center key. Contact the center administrator to change it.',
  'Tự gia hạn': 'Auto-renew',
  'Chỉ quản trị hệ thống hoặc quản trị trung tâm của tổ chức được đổi tự gia hạn kho.':
    "Only system administrators or the organization's center administrator can change pool auto-renew.",
  'Đã bật tự gia hạn kho.': 'Pool auto-renew turned on.',
  'Đã tắt tự gia hạn kho.': 'Pool auto-renew turned off.',
  'Tự gia hạn kho': 'Pool auto-renew',
  'Chưa có từ máy chủ': 'Not provided by the server',
  'Máy chủ chưa trả trạng thái tự gia hạn. Hãy tải lại kho suất sử dụng.':
    'The server did not return the auto-renew state. Reload the license pool.',
  'Khi bật, trước ngày hết hạn máy chủ gửi liên kết thanh toán PayOS cho quản trị trung tâm qua email và thông báo. Chỉ áp dụng khi kho đang hoạt động; không tự trừ tiền.':
    'When on, before the expiry date the server sends the center administrator a PayOS payment link by email and notification. Applies only while the pool is active; nothing is charged automatically.',
  'Gói do trung tâm cấp được gia hạn theo kho suất sử dụng của tổ chức.':
    'Center-issued plans renew with the organization license pool.',
  'Gói dùng thử không tự gia hạn. Mua gói Personal để bật tự gia hạn.':
    'Trial plans do not auto-renew. Buy a Personal plan to turn on auto-renew.',
  'Gói không còn hiệu lực nên không đổi được tự gia hạn. Hãy mua gói mới.':
    'This plan is no longer valid, so auto-renew cannot be changed. Please buy a new plan.',
  'Chỉ người chăm sóc cá nhân được đổi tự gia hạn gói của mình.':
    'Only personal caregivers can change auto-renew on their own plan.',
  'Chỉ bật tự gia hạn được khi gói đang hoạt động.':
    'Auto-renew can only be turned on while the plan is active.',
  'Gói do trung tâm cấp được gia hạn theo kho suất sử dụng của tổ chức. Hãy liên hệ quản trị trung tâm.':
    'Center-issued plans renew with the organization license pool. Please contact the center administrator.',
  'Gói không còn hiệu lực. Tải lại hoặc mua gói mới.':
    'The plan is no longer valid. Reload or buy a new plan.',
  'Chỉ bật tự gia hạn được khi gói trả phí đang hoạt động.':
    'Auto-renew can only be turned on for an active paid plan.',
  'Đã bật tự gia hạn.': 'Auto-renew turned on.',
  'Đã tắt tự gia hạn.': 'Auto-renew turned off.',
  'Bật lại để tiếp tục gia hạn gói đã hủy.':
    'Turn it back on to resume renewing the cancelled plan.',
  'Khi bật, trước ngày hết hạn máy chủ gửi liên kết thanh toán PayOS qua email và thông báo. Không tự trừ tiền.':
    'When on, before the expiry date the server sends a PayOS payment link by email and notification. Nothing is charged automatically.',
  'Gợi ý chuyển cấp lên 115': 'Suggested escalation to 115',
  '{count} cảnh báo chưa có ai tiếp nhận sau hơn 5 phút.':
    '{count} alert(s) not acknowledged by anyone after more than 5 minutes.',
  '{viu} · gửi lúc {time}': '{viu} · sent at {time}',
  'Một người được chăm sóc': 'A care recipient',
  'Xem và chuyển cấp': 'Review and escalate',
  'Còn cảnh báo Đã gửi khác; lọc theo trạng thái Đã gửi để xem đủ.':
    'More Sent alerts exist; filter by the Sent status to see them all.',
  'Chỉ quản trị hệ thống được gia hạn kho suất sử dụng thủ công.':
    'Only system administrators can renew a license pool manually.',
  'Kho đang tạm ngưng. Kích hoạt lại kho trước khi gia hạn.':
    'The pool is suspended. Reactivate it before renewing.',
  'Ngày hết hạn mới phải ở tương lai.': 'The new expiry date must be in the future.',
  'Ngày hết hạn mới không được quá 5 năm kể từ hôm nay.':
    'The new expiry date cannot be more than 5 years from today.',
  'Ngày hết hạn mới phải sau ngày hết hạn hiện tại.':
    'The new expiry date must be after the current expiry date.',
  'Số suất thêm phải là số nguyên từ 0 đến 10.000.':
    'Additional seats must be a whole number from 0 to 10,000.',
  'Kho suất sử dụng đang tạm ngưng. Liên hệ quản trị hệ thống, hoặc kích hoạt lại kho trước khi gia hạn.':
    'The license pool is suspended. Contact the system administrator, or reactivate the pool before renewing.',
  'Ngày hết hạn mới phải sau ngày hết hạn hiện tại. Tải lại kho để xem hạn mới nhất.':
    'The new expiry date must be after the current expiry. Reload the pool to see the latest expiry.',
  'Gia hạn thủ công': 'Renew manually',
  'Gia hạn kho suất sử dụng': 'Renew license pool',
  '{name}: kho và mọi mã đã phát cho gia đình được kéo dài đến ngày mới. Hạn hiện tại: {date}. Gia hạn thủ công không tạo giao dịch PayOS.':
    '{name}: the pool and every code issued to families are extended to the new date. Current expiry: {date}. Manual renewal does not create a PayOS transaction.',
  'Xác nhận gia hạn': 'Confirm renewal',
  'Ngày hết hạn mới': 'New expiry date',
  'Hết ngày đã chọn theo giờ máy của bạn; tối đa 5 năm kể từ hôm nay.':
    'End of the chosen day in your device time; at most 5 years from today.',
  'Số suất thêm': 'Additional seats',
  'Đã gia hạn kho suất sử dụng đến {date}.': 'License pool renewed until {date}.',
  'Chỉ quản trị hệ thống được xem kho suất sử dụng của tổ chức khác.':
    "Only system administrators can view another organization's license pool.",
  'Kho suất sử dụng trả về không thuộc tổ chức đã chọn.':
    'The returned license pool does not belong to the selected organization.',
  'Không bắt buộc. Quản trị trung tâm có thể đọc lý do này.':
    'Optional. The center administrator can read this reason.',
  'Không giới hạn': 'No limit',
  'Kích hoạt lại kho suất sử dụng': 'Reactivate license pool',
  'Kích hoạt lại kho': 'Reactivate pool',
  'Lý do tạm ngưng': 'Suspension reason',
  'Tạm ngưng kho suất sử dụng': 'Suspend license pool',
  'Tạm ngưng kho': 'Suspend pool',
  'Tạm ngưng lúc': 'Suspended at',
  'Tổ chức chưa có kho suất sử dụng.': 'This organization has no license pool yet.',
  'Tổ chức không hợp lệ.': 'Invalid organization.',
  'Xác nhận tạm ngưng': 'Confirm suspension',
  '{name}: kho trở về Đang hoạt động, hoặc Đã hết hạn nếu đã qua ngày hết hạn. Gói dịch vụ của người được chăm sóc được khôi phục theo trạng thái đó.':
    '{name}: the pool returns to Active, or Expired if its end date has passed. Care recipients get their licenses back according to that status.',
  '{name}: người được chăm sóc đang dùng gói dịch vụ của kho sẽ chuyển về Chưa có gói dịch vụ cho tới khi kích hoạt lại. Trung tâm không cấp thêm suất hoặc tạo mã được.':
    '{name}: care recipients using licenses from this pool will have no license until it is reactivated. The center cannot assign seats or generate keys.',
  '{used}/{total} suất · còn {available}': '{used}/{total} seats · {available} left',
  'Đã gửi yêu cầu. Tải lại kho suất sử dụng để xem trạng thái mới.':
    'Request sent. Reload the license pool to see the new status.',
  'Đã kích hoạt lại kho suất sử dụng.': 'License pool reactivated.',
  'Đã kích hoạt lại, nhưng kho đã quá hạn nên ở trạng thái Đã hết hạn.':
    'Reactivated, but the pool is past its end date so it is Expired.',
  'Đã tạm ngưng kho suất sử dụng.': 'License pool suspended.',
  'Kho suất sử dụng đã ở trạng thái tạm ngưng. Tải lại để xem trạng thái mới.':
    'The license pool is already suspended. Reload to see the current status.',
  'Kho suất sử dụng không còn tạm ngưng. Tải lại để xem trạng thái mới.':
    'The license pool is no longer suspended. Reload to see the current status.',
  'Gõ tên hoặc email để tìm': 'Type a name or email to search',
  'Gõ tên hoặc email': 'Type a name or email',
  'Bỏ chọn {name}': 'Clear {name}',
  'Đang tìm…': 'Searching…',
  'Không tải được kết quả. Thử gõ lại.': 'Could not load results. Try typing again.',
  'Không có kết quả phù hợp.': 'No matching results.',
  'Bỏ lọc này': 'Remove this filter',
  'Đang xem các bản ghi của một phiên điều hướng.': 'Showing records from one navigation session.',
  'Xem cùng phiên điều hướng': 'Show this navigation session',
  'Xem các thao tác trên đối tượng này': 'Show actions on this record',
  'Bắt buộc với vai trò không phải quản trị viên hệ thống; tổ chức phải hoạt động.':
    'Required for non-Admin roles; the organization must be active.',
  'Để trống để áp dụng toàn hệ thống.': 'Leave empty to apply system-wide.',
  'Không tải được danh sách tổ chức; tìm theo tên hoặc email.':
    'Could not load the organization list; search by name or email.',
  'Chưa xác nhận được kết quả hoặc liên kết đã tồn tại. Đóng hộp thoại, lọc theo hai tài khoản và tải lại trước khi gửi lại.':
    'The result is not confirmed or the link already exists. Close the form, filter by both accounts and reload before sending again.',
  // FE-35: license pools of all centers.
  'Kho suất sử dụng các trung tâm': 'Center license pools',
  'Số gói dịch vụ đã dùng, còn trống và hạn dùng của từng trung tâm.':
    'Used and free licenses and the expiry date of each center.',
  'Chỉ quản trị hệ thống được xem kho suất sử dụng các trung tâm.':
    'Only system administrators can view the license pools of all centers.',
  'Dữ liệu kho suất sử dụng từ máy chủ không hợp lệ.':
    'The license pool data from the server is invalid.',
  'Từ khóa tìm kiếm tối đa 200 ký tự.': 'The search term can be at most 200 characters.',
  'Số ngày sắp hết hạn phải từ 0 đến 365.': 'Days until expiry must be from 0 to 365.',
  'Tên trung tâm': 'Center name',
  'Gõ tên trung tâm': 'Type a center name',
  'Hết hạn trong (ngày)': 'Expires within (days)',
  'Kho đang hoạt động': 'Active pools',
  '{active}/{total} kho': '{active}/{total} pools',
  'Gói dịch vụ đã dùng': 'Licenses in use',
  '{used}/{total} ({percent}%)': '{used}/{total} ({percent}%)',
  'Cần chú ý': 'Needs attention',
  '{soon} sắp hết hạn · {suspended} tạm ngưng · {expired} hết hạn':
    '{soon} expiring soon · {suspended} suspended · {expired} expired',
  '{count} trung tâm đang hoạt động chưa mua kho suất sử dụng.':
    '{count} active centers have not bought a license pool.',
  'Không có kho suất sử dụng phù hợp.': 'No matching license pools.',
  'Danh sách kho suất sử dụng': 'License pool list',
  'Đã dùng / tổng': 'Used / total',
  'Còn trống': 'Free',
  'Trung tâm ngưng hoạt động': 'Center inactive',
  'Không hết hạn': 'No expiry',
  'còn {days} ngày': '{days} days left',
  '{totalCount} kho · Trang {page}/{p4}': '{totalCount} pools · Page {page}/{p4}',
  'Đi vào vùng an toàn': 'Entered safe zone',
  'Ra khỏi vùng an toàn': 'Left safe zone',
  'Đến địa điểm đã lưu': 'Arrived at saved place',
  'Cảnh báo vùng an toàn': 'Safe zone alerts',
  'Xem sự kiện vùng': 'Show zone events',
  'Chọn người được chăm sóc trước.': 'Choose a care recipient first.',
  'Chưa chọn người được chăm sóc.': 'No care recipient selected.',
  'Không có sự kiện vùng an toàn phù hợp.': 'No matching safe zone events.',
  'Danh sách sự kiện vùng an toàn': 'Safe zone event list',
  'Vùng / địa điểm': 'Zone / place',
  'Đã gửi cảnh báo': 'Alert sent',
  'Vị trí': 'Location',
  'Vùng hoặc địa điểm đã bị xóa': 'Zone or place was deleted',
  'Không gửi': 'Not sent',
  '{totalCount} sự kiện · Trang {page}/{p4}': '{totalCount} events · Page {page}/{p4}',
  'Loại sự kiện không hợp lệ.': 'Invalid event type.',
  'Sự kiện không thuộc người khiếm thị được chọn.': 'Event does not belong to the selected VIU.',
  'Lọc lịch sử': 'Filter history',
  'Tải lại địa điểm': 'Reload places',
  'Xuất CSV': 'Export CSV',
  'Đang xuất…': 'Exporting…',
  'Không có lịch sử phù hợp để xuất.': 'There is no matching history to export.',
  'Đã xuất {count} bản ghi.': 'Exported {count} records.',
  'Đã xuất {count} bản ghi mới nhất trong tổng số {total}.':
    'Exported the latest {count} of {total} records.',
  'Vị trí và vùng an toàn': 'Location and safe zones',
  'Ứng dụng của người khiếm thị': 'The app for people with visual impairments',
  'Biết người thân đang ở đâu.': 'Know where your family member is.',
  'Nhận cảnh báo khi họ cần.': 'Get an alert when they need you.',
  'Người khiếm thị dùng ứng dụng VisionAid trên điện thoại để tránh vật cản, đọc chữ và gọi trợ giúp. Người chăm sóc dùng trang Web này để xem vị trí, nhận cảnh báo và quản lý thông tin hỗ trợ.':
    'People with visual impairments use the VisionAid phone app to avoid obstacles, read text and call for help. Caregivers use this website to see their location, receive alerts and manage support information.',
  'Xem cách hoạt động': 'See how it works',
  'Người khiếm thị đi trên vỉa hè có gạch dẫn hướng, cầm gậy trắng và đeo điện thoại trước ngực.':
    'A visually impaired person walks along a sidewalk with a tactile guiding strip, holding a white cane, a phone strapped to their chest.',
  'Một người bước đi với gậy trắng và điện thoại đeo trước ngực.':
    'One person walks with a white cane and a phone strapped to their chest.',
  'Một người ở xa muốn biết họ có an toàn không.': 'Someone far away wants to know they are safe.',
  'VisionAid nối hai đầu của cùng một hành trình.':
    'VisionAid connects both ends of the same journey.',
  'Minh họa: vật cản tiến lại gần qua ba vùng nhận biết.':
    'Illustration: an obstacle approaches through three detection zones.',
  'Máy chủ': 'Server',
  'Trên điện thoại': 'On the phone',
  'Minh họa, không phải dữ liệu thật.': 'Illustration, not real data.',
  'Tài khoản đã xóa lúc {time}.': 'Account deleted at {time}.',
  'Đã quá {days} ngày nên máy chủ có thể không cho khôi phục.':
    'More than {days} days have passed, so the server may refuse to restore it.',
  'Có thể khôi phục trong {days} ngày kể từ lúc xóa.':
    'It can be restored within {days} days of deletion.',
  'Khôi phục tài khoản': 'Restore account',
  '{email}: mở lại tài khoản, đăng nhập bằng mật khẩu cũ, giữ nguyên liên kết và dữ liệu còn lưu. Dữ liệu đã bị xóa theo thời hạn lưu trữ sẽ không lấy lại được.':
    '{email}: reopen the account with its old password, keeping its links and remaining data. Data already removed by retention cannot be recovered.',
  'Đã khôi phục tài khoản. Kho của tổ chức hết suất nên người dùng chưa có gói dịch vụ; trung tâm cần cấp một suất, trước đó chỉ dùng được SOS.':
    'Account restored. The organization pool has no free seat, so the user has no license; the center must assign one, and until then only SOS works.',
  'Đã khôi phục tài khoản.': 'Account restored.',
  'Đã hẹn đổi sang gói {name} ({seats} suất) vào {time}. Trước thời điểm đó, cấp suất sử dụng mới bị giới hạn ở số suất của gói mới.':
    'Switch to {name} ({seats} seats) scheduled for {time}. Until then, new licenses are capped at the new package seat count.',
  'Giữ gói hiện tại': 'Keep current package',
  'Hủy hẹn đổi gói': 'Cancel scheduled change',
  'Kho tiếp tục dùng gói {name} sau khi hết kỳ.': 'The pool keeps {name} after this period.',
  'Để trống để bỏ giá năm; gói khi đó chỉ bán theo tháng. Giá năm chưa dùng để thanh toán trên Web.':
    'Leave empty to remove the yearly price; the package is then sold monthly only. The yearly price is not used for web checkout yet.',
  'Loại thay đổi': 'Change type',
  'Gói hiện tại': 'Current package',
  'Cần trả ngay': 'Pay now',
  'Áp dụng từ': 'Applies from',
  'Kho hết hạn vào': 'Pool expiry after the change',
  'Số suất': 'Seats',
  '{from} → {to} suất, đang dùng {used}': '{from} → {to} seats, {used} in use',
  '{to} suất': '{to} seats',
  'Chỉ trả phần chênh lệch cho {days} ngày còn lại. Số suất đổi ngay sau khi thanh toán, ngày hết hạn giữ nguyên.':
    'You pay only the difference for the {days} days left. Seats change right after payment; the expiry date stays the same.',
  'Gói rẻ hơn gói hiện tại: không trả tiền và không hoàn tiền. Kho đổi sang gói này khi hết kỳ đã trả.':
    'Cheaper than the current package: nothing to pay and no refund. The pool switches at the end of the paid period.',
  'Trả trọn giá; kỳ mới nối tiếp sau ngày hết hạn hiện tại.':
    'Full price; the new period follows the current expiry date.',
  'Trả trọn giá; kỳ mới bắt đầu từ lúc thanh toán thành công.':
    'Full price; the new period starts when the payment succeeds.',
  'Số gói dịch vụ đang dùng nhiều hơn số suất của gói này. Hãy thu hồi {count} gói dịch vụ trước khi đổi gói.':
    'More seats are in use than this package has. Revoke {count} licenses in the pool before switching.',
  'Hiện chưa thể đổi gói cho kho này. Hãy tải lại kho suất sử dụng để kiểm tra trạng thái.':
    'The pool cannot change package right now. Reload the license pool to check its status.',
  'Đã hẹn đổi sang gói {name} vào {time}.': 'Switch to {name} scheduled for {time}.',
  'Hẹn đổi gói vào cuối kỳ': 'Schedule for end of period',
  'Mã kích hoạt đã phát': 'Issued keys',
  'Xem lại mã kích hoạt đã tạo và thu hồi mã kích hoạt chưa dùng nếu phát nhầm. Thu hồi trả suất về kho; mã đã kích hoạt hoặc đã hết hạn không thu hồi được.':
    'Look up keys you created and revoke an unused key sent by mistake. Revoking returns the seat to the pool; activated or expired keys cannot be revoked.',
  'Tìm theo mã kích hoạt, ghi chú hoặc người kích hoạt':
    'Search by key, note or activating caregiver',
  'Trạng thái mã kích hoạt': 'Key status',
  'Hạn dùng': 'Valid until',
  'Người kích hoạt': 'Activated by',
  'Thu hồi lúc {time}': 'Revoked at {time}',
  'Không có mã kích hoạt phù hợp với bộ lọc.': 'No keys match the filter.',
  'Chưa phát mã kích hoạt nào từ kho này.': 'No keys have been issued from this pool yet.',
  'Thu hồi mã kích hoạt': 'Revoke key',
  'Thu hồi mã kích hoạt có ghi chú "{note}", tạo lúc {time}. Gia đình sẽ không kích hoạt được mã kích hoạt này nữa và một suất được trả về kho.':
    'Revoke the key noted "{note}", created at {time}. The family can no longer activate it and one seat returns to the pool.',
  'không có ghi chú': 'no note',
  'Đã thu hồi mã kích hoạt và trả một suất về kho.':
    'Key revoked and one seat returned to the pool.',
  'Mã kích hoạt vừa tạo vẫn còn trong danh sách Mã kích hoạt đã phát. Tạo mã kích hoạt mới không thu hồi mã kích hoạt cũ và không hoàn lại suất đã dùng.':
    'The new key stays in the Issued keys list. Continuing does not revoke it or return the seat it used.',
  'Có thể xem lại mã kích hoạt này bất cứ lúc nào trong danh sách Mã kích hoạt đã phát.':
    'You can look this key up again any time in the Issued keys list.',
  'Đã cập nhật ảnh đại diện.': 'Profile picture updated.',
  'Không thể tải ảnh lên.': 'Could not upload the picture.',
  'Xóa ảnh đại diện': 'Remove profile picture',
  'Ảnh đại diện sẽ bị xóa khỏi máy chủ. Bạn có thể tải ảnh khác sau.':
    'Your profile picture will be deleted from the server. You can upload another later.',
  'Đã xóa ảnh đại diện.': 'Profile picture removed.',
  'Máy chủ không cho gửi lại thông báo này.':
    'The server does not allow resending this notification.',
  'Đã gửi lại thành công.': 'Resent successfully.',
  'Đang gửi lại; trạng thái sẽ được cập nhật sau.': 'Resending; the status will update shortly.',
  'Gửi lại vẫn thất bại: {reason}': 'Resend failed again: {reason}',
  'không rõ lý do': 'unknown reason',
  'Đang gửi lại…': 'Resending…',
  'Gửi lại': 'Resend',
  'Chỉ quản trị viên hệ thống được khôi phục tài khoản.': 'Only an Admin can restore accounts.',
  'Tài khoản không hợp lệ.': 'Invalid account.',
  'Máy chủ trả về tài khoản khác với tài khoản đã chọn.':
    'The server returned a different account from the one selected.',
  'Ảnh đại diện tối đa 10 MB.': 'Profile pictures are limited to 10 MB.',
  'Đã gửi ảnh nhưng chưa nhận được kết quả từ máy chủ. Hãy tải lại trang.':
    'The picture was sent but the result could not be read. Reload the page.',
  'Địa chỉ ảnh không hợp lệ.': 'Invalid picture address.',
  'Chưa dùng': 'Unused',
  'Đã kích hoạt': 'Activated',
  'Chỉ quản trị viên trung tâm được xem mã kích hoạt đã phát.':
    'Only a center admin with an organization can view issued keys.',
  'Dữ liệu mã kích hoạt đã phát không hợp lệ. Hãy tải lại.':
    'Issued key data is invalid. Please reload.',
  'Chỉ quản trị viên trung tâm được thu hồi mã kích hoạt.':
    'Only a center admin with an organization can revoke keys.',
  'Chỉ thu hồi được mã kích hoạt chưa dùng và còn hạn.':
    'Only unused keys that are still valid can be revoked.',
  'Mã kích hoạt không hợp lệ. Hãy tải lại.': 'Invalid key. Please reload.',
  'Mua lần đầu': 'First pool purchase',
  'Gia hạn cùng gói': 'Renew same package',
  'Kỳ mới sau khi kho hết hạn': 'New period after expiry',
  'Nâng gói': 'Upgrade',
  'Hạ gói vào cuối kỳ': 'Downgrade at end of period',
  'Chỉ quản trị viên trung tâm được đổi gói Business.':
    'Only a center admin with an organization can change the Business package.',
  'Chưa đọc được báo giá đổi gói. Hãy tải lại.':
    'Could not read the package change quote. Please reload.',
  'Kho hoặc gói không hợp lệ. Hãy tải lại.': 'Invalid pool or package. Please reload.',
  'Chỉ gửi lại được thông báo đang thất bại.': 'Only failed notifications can be resent.',
  'Thông báo này đã được gửi lại đủ 3 lần.': 'Already resent the maximum of 3 times.',
  'Tài khoản người nhận đã bị khóa hoặc xóa.': 'The recipient account is deactivated or deleted.',
  'Kênh này không hỗ trợ gửi lại.': 'This channel does not support resending.',
  'Thông báo đã đến nơi chỉ có ích ngay lúc đến; gửi lại muộn sẽ gây hiểu nhầm.':
    'Arrival notices only make sense on arrival; a late resend would be wrong.',
  'Người nhận chưa đăng nhập thiết bị nào. Gửi lại sau khi họ đăng nhập ứng dụng.':
    'The recipient has no signed-in device. Resend after they sign in to the app.',
  'Sự cố khẩn cấp đã được giải quyết, đã bỏ qua hoặc đã gọi hỗ trợ.':
    'The emergency was already resolved, dismissed or called.',
  'Thông báo đã quá cũ để gửi lại.': 'The notification is too old to resend.',
  'Gói dịch vụ đã được gia hạn nên lời nhắc không còn cần thiết.':
    'The license has been renewed, so the reminder no longer applies.',
  'Người nhận không còn nhận cảnh báo của người này.':
    'The recipient no longer receives alerts for this person.',
  'Thông báo này đang được gửi lại.': 'This notification is already being resent.',
  'Thông báo không hợp lệ.': 'Invalid notification.',
  'Gói rẻ hơn gói hiện tại: hẹn đổi vào cuối kỳ, không cần thanh toán.':
    'Cheaper than the current package: schedule the switch for the end of the period, no payment needed.',
  'Cần thu hồi {count} gói dịch vụ đang dùng trước khi đổi sang gói này.':
    'Revoke {count} licenses in use before switching to this package.',
  'Nâng gói Business': 'Business upgrade',
  'Hộp thư thông báo': 'Notification inbox',
  'Tra cứu thông báo': 'Notification lookup',
  'Xem bản đồ': 'View map',
  'Truy vết hoạt động của {name}': 'Activity trace for {name}',
  'Tất cả hoạt động': 'All activities',
  'Cách xem': 'View',
  'Dòng thời gian': 'Timeline',
  'Hướng dẫn dẫn đường': 'Navigation guidance',
  'Câu đã đọc': 'Spoken text',
  'Người xử lý': 'Handled by',
  'Mỗi dòng là một quyết định dẫn đường. "Điện thoại tự quyết định" là khi máy chủ chậm, mất mạng hoặc chưa có phiên; câu đã đọc trống nghĩa là ứng dụng không nói gì.':
    'Each row is one guidance decision. "Decided on the phone" means the server was slow, offline or had no session; an empty spoken text means the app stayed silent.',
  'Chưa có hướng dẫn dẫn đường được ghi nhận.': 'No navigation guidance recorded yet.',
  'Nơi quyết định': 'Decided by',
  'Không nói gì': 'Not spoken',
  'Phản hồi': 'Response',
  '{name} đã tiếp nhận.': 'Acknowledged by {name}.',
  '{name} đã giải quyết.': 'Resolved by {name}.',
  'Đã thông báo cho': 'Notified',
  'Chưa có thông báo nào được ghi nhận cho cảnh báo này.':
    'No notifications recorded for this alert.',
  'Đã xem': 'Read',
  'Chưa xem': 'Unread',
  'Thông báo, {count} chưa đọc': 'Notifications, {count} unread',
  'Thông báo': 'Notifications',
  'Mọi thông báo đã gửi cho bạn. Một thông báo gửi qua nhiều cách (ứng dụng, email, trên web) chỉ hiện thành một mục.':
    'Every notification sent to you, with Push, Email and Realtime grouped into one item.',
  'Lọc thông báo': 'Filter notifications',
  'Đã đánh dấu {count} thông báo là đã xem.': 'Marked {count} notifications as read.',
  'Đánh dấu tất cả đã xem': 'Mark all as read',
  'Tất cả thông báo': 'All notifications',
  'Chỉ thông báo chưa xem': 'Unread only',
  'Không có thông báo phù hợp.': 'No matching notifications.',
  'Đã xem lúc {time}': 'Read at {time}',
  'Mở chi tiết': 'Open details',
  'Đánh dấu đã xem': 'Mark as read',
  'Xem từng thông báo đã gửi: ai nhận, về người nào, gửi qua đâu, đã gửi được chưa và đã xem lúc nào.':
    'Each notification delivery: recipient, care recipient, channel, status and read state.',
  'Thông báo gửi cho người nhận hoặc về người được chăm sóc trong trung tâm của bạn.':
    'Notifications sent to recipients or about care recipients in your center.',
  'Không rõ tên': 'Unknown name',
  'qua liên kết chăm sóc': 'through a care link',
  'Phát hiện vật cản': 'Obstacle detection',
  'Ra/vào vùng an toàn': 'Safe zone entry/exit',
  'Bạn không còn quyền xem cảnh báo này (liên kết chăm sóc đã kết thúc).':
    'You can no longer view this alert (the care link has ended).',
  'Cảnh báo gói dịch vụ sắp hết hạn': 'License expiry warning',
  'Gợi ý gọi hỗ trợ khẩn cấp': 'Emergency call suggestion',
  'Không liên hệ được ai': 'Nobody reachable',
  'Nhắc gia hạn gói dịch vụ': 'License renewal reminder',
  'Gửi thất bại': 'Failed',
  'Chỉ quản trị viên được tra cứu thông báo.': 'Only administrators can look up notifications.',
  'JPG hoặc PNG, bản demo tối đa 2 MB.': 'JPG or PNG, up to 2 MB in the demo.',
  'JPG, PNG hoặc WebP, tối đa 10 MB. Ảnh được cắt vuông và xóa thông tin vị trí; chỉ người có liên quan đến bạn trong VisionAid xem được.':
    'JPG, PNG or WebP, up to 10 MB. The picture is cropped square and its location data removed; only people connected to you in VisionAid can see it.',
  'Đổi ảnh': 'Change picture',
  'Truy vết hoạt động': 'Activity trace',
  'Xem lại theo thời gian những gì người khiếm thị trong trung tâm đã làm và các chỉ dẫn di chuyển ứng dụng đã đọc cho họ.':
    'Activity timeline and navigation guidance of care recipients in your center.',
  'Chọn một người để xem hoạt động đã được ghi nhận.':
    'Pick a person to see their recorded activity.',
  'Quản lý gương mặt thân quen': 'Manage familiar faces',
  'Mời bằng mã QR': 'Invite with a QR code',
  'Người chăm sóc chính tạo mã QR dùng một lần cho người chăm sóc phụ. Người được mời quét hoặc nhập mã, xem trước rồi chấp nhận để được liên kết với các quyền đã chọn.':
    'The primary caregiver creates a single-use QR code for a secondary caregiver. The invitee scans or enters the code, previews it and accepts to be linked with the chosen permissions.',
  'Tạo lời mời': 'Create invitation',
  'Nhận lời mời': 'Accept invitation',
  'Đã chấp nhận lời mời. Bạn là người chăm sóc phụ của {name}.':
    'Invitation accepted. You are now a secondary caregiver of {name}.',
  'Tạo lời mời người chăm sóc phụ': 'Invite a secondary caregiver',
  'Chỉ hiện những người mà bạn là người chăm sóc chính.':
    'Only people you are the primary caregiver of are listed.',
  'Đang tạo…': 'Creating…',
  'Tạo mã QR': 'Create QR code',
  'Lời mời làm người chăm sóc phụ cho {name}. Quyền: {permissions}.':
    'Invitation to be a secondary caregiver of {name}. Permissions: {permissions}.',
  'Mã QR lời mời': 'Invitation QR code',
  'Hết hạn lúc {time}. Mã chỉ dùng được một lần.': 'Expires at {time}. The code can be used once.',
  'Mã lời mời (nếu không quét được QR)': 'Invitation code (if the QR cannot be scanned)',
  'Đã sao chép mã lời mời.': 'Invitation code copied.',
  'Không sao chép được. Hãy chọn mã và sao chép thủ công.':
    'Could not copy. Select the code and copy it manually.',
  'Sao chép mã': 'Copy code',
  'Lời mời đã tạo': 'Invitations created',
  'Người chấp nhận': 'Accepted by',
  'Chưa có lời mời nào cho người này.': 'No invitations for this person yet.',
  'Nhận lời mời người chăm sóc phụ': 'Accept a secondary caregiver invitation',
  'Mã lời mời': 'Invitation code',
  'Hoặc chọn ảnh chụp mã QR': 'Or choose a photo of the QR code',
  'Không đọc được ảnh QR.': 'Could not read the QR image.',
  'Đang kiểm tra…': 'Checking…',
  'Xem lời mời': 'View invitation',
  'Người mời': 'Invited by',
  'Chấp nhận lời mời': 'Accept invitation',
  'Dữ liệu lời mời không hợp lệ. Hãy tải lại.': 'Invitation data is invalid. Please reload.',
  'Chỉ tài khoản người chăm sóc mới dùng được lời mời.':
    'Only caregivers can use link invitations.',
  'Mã lời mời không hợp lệ. Kiểm tra lại mã hoặc quét lại QR.':
    'Invalid invitation code. Check the code or scan the QR again.',
  'Chọn người được chăm sóc trước khi tạo lời mời.':
    'Pick a care recipient before creating an invitation.',
  'Lời mời máy chủ trả về không khớp với người đã chọn.':
    'The returned invitation does not match the selected person.',
  'Chọn người được chăm sóc trước khi xem lời mời.':
    'Pick a care recipient before viewing invitations.',
  'Bạn không có quyền xem lời mời của người này.':
    'You are not allowed to view this person’s invitations.',
  'Không tìm thấy mã QR trong ảnh. Hãy chụp rõ hơn hoặc nhập mã.':
    'No QR code found in the image. Take a clearer photo or enter the code.',
  '{count} chưa xem': '{count} unread',
  'Đã xem hết': 'All read',
  'Không tải được thông báo.': 'Could not load notifications.',
  'Chưa có thông báo nào.': 'No notifications yet.',
  '{count} thông báo chưa xem của người đang lọc.':
    '{count} unread notifications for the selected person.',
  '{count} thông báo chưa xem.': '{count} unread notifications.',
  'Bạn đã xem hết thông báo.': 'You have read all notifications.',
  '24 giờ qua': 'Last 24 hours',
  '7 ngày qua': 'Last 7 days',
  'Đã gửi đi': 'Sent',
  'Theo cách gửi': 'By channel',
  '{sent} đã gửi · {failed} thất bại': '{sent} sent · {failed} failed',
  'Chưa có cảnh báo nào được gửi trong khoảng này.': 'No alerts were sent in this period.',
  '"Đã gửi đi" nghĩa là máy chủ đã chuyển cảnh báo đi, chưa chắc người nhận đã mở xem. Bộ lọc bên dưới chỉ áp dụng cho danh sách thông báo thất bại.':
    '"Sent" means the server passed the alert on; the recipient may not have opened it yet. The filter below applies only to the failed notifications list.',
  'Cách xem lịch sử': 'History view',
  'Theo loại hoạt động': 'By activity type',
  'Phần của báo cáo': 'Report sections',
  'Xử lý cảnh báo của nhân viên': 'Staff alert handling',
  'Phần của trang gói dịch vụ': 'License page sections',
  'Trạng thái và gói': 'Status and plan',
  'Phần của kho suất sử dụng': 'License pool sections',
  'Phần của trang liên kết': 'Link page sections',
  'Phần của hồ sơ': 'Profile sections',
  'Mật khẩu và đăng nhập': 'Password and sign-in',
  'Phần của trang': 'Page sections',
  'Giao diện tối': 'Dark theme',
  'Chuyển sang giao diện sáng': 'Switch to light theme',
  'Chuyển sang giao diện tối': 'Switch to dark theme',
  'Lần ghi nhận: {p1}': 'Last recorded: {p1}',
  'Kỳ báo cáo:': 'Report period:',
  'Thao tác từ ngày': 'Actions from',
  'Thao tác đến ngày': 'Actions to',
  'Để trống ngày để xem toàn bộ thời gian còn lưu.':
    'Leave the dates empty to see everything still stored.',
  'Danh sách này chỉ lấy vị trí của tối đa 10 người trên trang hiện tại.':
    'This list only shows locations for up to 10 people on the current page.',
  'Số liệu của ngày hôm trước được tổng hợp lúc 07:00 sáng. Số thành công phụ thuộc quy tắc tổng hợp của từng nguồn.':
    'Figures for the previous day are compiled at 7:00 AM. Success counts depend on the aggregation rules of each source.',
  'Bán kính mặc định của vùng an toàn': 'Default safe zone radius',
  'Bán kính mặc định để báo đã đến nơi': 'Default arrival radius',
  'Bán kính được điền sẵn khi tạo vùng an toàn mới.':
    'The radius filled in when creating a new safe zone.',
  'Bộ xử lý dẫn đường đang dùng': 'Active navigation engine',
  'Chăm sóc': 'Caregiving',
  'Chưa hỗ trợ xem trên Web': 'Not available on the web yet',
  'Chỉ máy chủ dùng': 'Server only',
  'Chọn bộ xử lý tạo hướng dẫn đi đường: JEV, Groq hoặc theo quy tắc.':
    'Choose the engine that creates walking directions: JEV, Groq or rule-based.',
  'Cuộc gọi không được trả lời sau ngần này sẽ được ghi là gọi nhỡ.':
    'A call not answered within this time is marked as missed.',
  'Cuộc gọi tự kết thúc khi đạt thời lượng này.':
    'A call ends automatically when it reaches this length.',
  'Cấu hình': 'Setting',
  'Danh bạ gương mặt': 'Face registry',
  'Dùng khi chưa có máy chủ kết nối cuộc gọi nào đang bật.':
    'Used when no call connection server is enabled.',
  'Dẫn đường': 'Navigation',
  'Dẫn đường bằng AI trên máy chủ': 'Server-side AI navigation',
  'Gương mặt chỉ được xem là trùng khi mức giống đạt mức này (từ 0 đến 1).':
    'A face only counts as a match when the similarity reaches this level (0 to 1).',
  'Gọi thoại và video': 'Voice and video calls',
  'Gửi lời nhắc kèm liên kết thanh toán trước ngày hết hạn số ngày này.':
    'Send a reminder with a payment link this many days before expiry.',
  'Khi bật, ứng dụng di động gửi hình ảnh lên máy chủ để nhận hướng dẫn đi đường.':
    'When on, the mobile app sends images to the server to get walking directions.',
  'Khi tắt, ứng dụng ẩn chức năng gọi thoại và video.':
    'When off, the app hides voice and video calls.',
  'Khi vào trong bán kính này của địa điểm quen thuộc, hệ thống xem là đã đến nơi.':
    'Entering this radius around a familiar place counts as arriving.',
  'Khoảng nghỉ giữa hai lần đọc thông báo': 'Pause between spoken announcements',
  'Kết quả đọc chữ thấp hơn mức này được đánh dấu là chưa chắc chắn (từ 0 đến 1).':
    'Text reading results below this level are marked as uncertain (0 to 1).',
  'Lưu trữ dữ liệu': 'Data retention',
  'Lịch sử nhận diện gương mặt cũ hơn số ngày này sẽ bị xóa.':
    'Face recognition history older than this many days is deleted.',
  'Lịch sử thông báo đã gửi hoặc gửi lỗi cũ hơn số ngày này sẽ bị xóa.':
    'Sent or failed notification history older than this many days is deleted.',
  'Lịch sử vị trí cũ hơn số ngày này sẽ bị xóa.':
    'Location history older than this many days is deleted.',
  'Máy chủ kiểm tra lại trạng thái gói của tài khoản sau khoảng thời gian này.':
    'The server rechecks the plan status of an account after this time.',
  'Máy chủ kết nối cuộc gọi dự phòng': 'Backup call connection server',
  'Mã QR mời chỉ dùng được một lần và hết hạn sau khoảng thời gian này.':
    'An invitation QR code works once and expires after this time.',
  'Mã kỹ thuật': 'Technical key',
  'Mức giống tối thiểu khi nhận diện gương mặt': 'Minimum face match similarity',
  'Người trong danh bạ gương mặt chỉ được nhận diện khi có đủ số ảnh này.':
    'A person in the face registry is only recognised once they have this many photos.',
  'Ngừng gửi thông báo cho thiết bị không hoạt động': 'Stop notifying inactive devices',
  Nhóm: 'Group',
  'Nhật ký vật cản, dẫn đường và lệnh giọng nói cũ hơn số ngày này sẽ bị xóa.':
    'Obstacle, navigation and voice command logs older than this many days are deleted.',
  'Nhắc gia hạn trước khi gói hết hạn': 'Renewal reminder before expiry',
  'Nơi sử dụng': 'Used by',
  'Nếu máy chủ trả lời chậm hơn mức này, ứng dụng chuyển sang dẫn đường theo quy tắc.':
    'If the server answers slower than this, the app switches to rule-based navigation.',
  'Sau khi gói hết hạn, tài khoản vẫn dùng được thêm số ngày này rồi mới bị giới hạn.':
    'After a plan expires, the account keeps working for this many days before being limited.',
  'Số liên hệ khẩn cấp mỗi người khiếm thị được lưu.':
    'Emergency contacts each visually impaired user can save.',
  'Số liên hệ khẩn cấp tối đa': 'Maximum emergency contacts',
  'Số ngày gia hạn sau khi gói hết hạn': 'Grace days after a plan expires',
  'Số người chăm sóc tối đa cho một người khiếm thị':
    'Maximum caregivers per visually impaired user',
  'Số người chăm sóc đang liên kết cùng lúc với một người khiếm thị.':
    'Caregivers linked to one visually impaired user at the same time.',
  'Số người khiếm thị một người chăm sóc được liên kết cùng lúc.':
    'Visually impaired users one caregiver can be linked to at the same time.',
  'Số người khiếm thị tối đa cho một người chăm sóc':
    'Maximum visually impaired users per caregiver',
  'Số người mỗi người khiếm thị được lưu trong danh bạ gương mặt.':
    'People each visually impaired user can save in the face registry.',
  'Số người tối đa trong danh bạ gương mặt': 'Maximum people in the face registry',
  'Số địa điểm mỗi người khiếm thị được lưu.': 'Places each visually impaired user can save.',
  'Số địa điểm quen thuộc tối đa': 'Maximum familiar places',
  'Số ảnh tối thiểu để nhận diện một người': 'Minimum photos to recognise a person',
  'Thanh toán trực tuyến': 'Online payment',
  'Theo quy tắc': 'Rule-based',
  'Thiết bị không mở ứng dụng quá số ngày này sẽ thôi nhận thông báo đẩy.':
    'Devices that have not opened the app for this many days stop receiving push notifications.',
  'Thời gian chờ tối đa khi dẫn đường': 'Maximum navigation wait time',
  'Thời gian ghi nhớ trạng thái gói dịch vụ': 'Plan status cache time',
  'Thời gian lưu lịch sử gửi thông báo': 'Notification history retention',
  'Thời gian lưu lịch sử nhận diện gương mặt': 'Face recognition history retention',
  'Thời gian lưu lịch sử vị trí': 'Location history retention',
  'Thời gian lưu nhật ký hoạt động': 'Activity log retention',
  'Thời gian lưu ảnh cảnh báo khẩn cấp': 'Emergency photo retention',
  'Thời gian lưu ảnh đọc chữ': 'Text reading photo retention',
  'Thời gian đổ chuông': 'Ringing time',
  'Thời hạn mã QR mời người chăm sóc': 'Caregiver invitation QR lifetime',
  'Thời lượng tối đa của một cuộc gọi': 'Maximum call length',
  'Trí tuệ nhân tạo': 'Artificial intelligence',
  'Tất cả nhóm': 'All groups',
  'Từ {min} đến {max}': 'From {min} to {max}',
  'Vật cản chỉ được báo khi điểm tin cậy đạt mức này (từ 0 đến 1).':
    'Obstacles are only reported when the confidence reaches this level (0 to 1).',
  giây: 'seconds',
  'liên hệ': 'contacts',
  'mili giây': 'milliseconds',
  mét: 'meters',
  ngày: 'days',
  người: 'people',
  phút: 'minutes',
  tháng: 'months',
  ảnh: 'photos',
  'Đọc thông báo': 'Spoken announcements',
  'Độ tin cậy tối thiểu khi nhận diện vật cản': 'Minimum obstacle detection confidence',
  'Độ tin cậy tối thiểu khi đọc chữ': 'Minimum text reading confidence',
  'Ảnh chụp khi đọc chữ bị xóa sau số ngày này; kết quả chữ vẫn được giữ.':
    'Photos taken for text reading are deleted after this many days; the text is kept.',
  'Ảnh chụp kèm cảnh báo bị xóa sau số tháng này; thông tin cảnh báo vẫn được giữ.':
    'Photos attached to alerts are deleted after this many months; the alert is kept.',
  'Ứng dụng di động chờ ít nhất ngần này giữa hai lần đọc to thông báo.':
    'The mobile app waits at least this long between two spoken announcements.',
  'Ứng dụng di động đọc được': 'Readable by the mobile app',
  'Khi tắt, không tạo được liên kết thanh toán mới; giao dịch đang chờ vẫn được xử lý.':
    'When off, no new payment links can be created; pending payments are still processed.',
  'Gói hệ thống không thể xóa. Hãy ngừng bán nếu không dùng nữa.':
    'System packages cannot be deleted. Stop selling it if it is no longer needed.',
  'Gói đã có người mua hoặc đang được dùng. Hãy bỏ chọn “Đang mở bán” để ngừng bán thay vì xóa.':
    'This package has been bought or is in use. Untick “On sale” to stop selling it instead of deleting it.',
  'Nhận cuộc gọi này cũng ghi nhận bạn đã tiếp nhận cảnh báo khẩn cấp.':
    'Answering this call also records that you acknowledged the emergency alert.',
  'Xem cảnh báo khẩn cấp': 'View the emergency alert',
  'Ba lô': 'Backpack',
  'Biển dừng': 'Stop sign',
  'Bàn chải đánh răng': 'Toothbrush',
  'Bàn phím': 'Keyboard',
  'Bàn ăn': 'Dining table',
  'Bánh mì kẹp': 'Sandwich',
  'Bánh ngọt': 'Cake',
  'Bánh vòng': 'Donut',
  Bát: 'Bowl',
  'Bình hoa': 'Vase',
  Bò: 'Cow',
  'Bông cải xanh': 'Broccoli',
  'Bạn có thông báo mới. Mở ứng dụng VisionAid để xem chi tiết.':
    'You have a new notification. Open the VisionAid app for details.',
  'Bấm nút khẩn cấp': 'Emergency button pressed',
  'Bồn cầu': 'Toilet',
  'Bồn rửa': 'Sink',
  Cam: 'Orange',
  Chai: 'Bottle',
  Chim: 'Bird',
  Chuối: 'Banana',
  'Chuột máy tính': 'Computer mouse',
  Chó: 'Dog',
  'Chưa chắc chắn': 'Not certain',
  'Chậu cây': 'Potted plant',
  'Chỉ ghi nhận': 'Recorded only',
  'Cà rốt': 'Carrot',
  'Cà vạt': 'Tie',
  Cốc: 'Cup',
  'Cột thu phí đỗ xe': 'Parking meter',
  Cừu: 'Sheep',
  Dao: 'Knife',
  Diều: 'Kite',
  Email: 'Email',
  Ghế: 'Chair',
  'Ghế dài': 'Bench',
  'Ghế sofa': 'Sofa',
  Giường: 'Bed',
  'Găng bóng chày': 'Baseball glove',
  Gấu: 'Bear',
  'Gấu bông': 'Teddy bear',
  'Gậy bóng chày': 'Baseball bat',
  'Gọi bằng giọng nói': 'Called by voice',
  'Hươu cao cổ': 'Giraffe',
  'Không nhận ra lệnh': 'Command not recognised',
  Kéo: 'Scissors',
  'Ly rượu': 'Wine glass',
  'Lò nướng': 'Oven',
  'Lò vi sóng': 'Microwave',
  'Máy bay': 'Airplane',
  'Máy chủ (AI dự phòng)': 'Server (backup AI)',
  'Máy chủ (AI)': 'Server (AI)',
  'Máy chủ (theo quy tắc)': 'Server (rule-based)',
  'Máy nướng bánh': 'Toaster',
  'Máy sấy tóc': 'Hair dryer',
  'Máy tính xách tay': 'Laptop',
  'Mã kích hoạt': 'Activation code',
  Mèo: 'Cat',
  'Một tài khoản người chăm sóc đã bị khóa nên có người khiếm thị không còn người chăm sóc chính. Hãy chọn người chăm sóc chính mới.':
    'A caregiver account was deactivated, so a visually impaired user no longer has a primary caregiver. Please choose a new primary caregiver.',
  'Một tài khoản người chăm sóc đã bị khóa nên {who} không còn người chăm sóc chính. Hãy chọn người chăm sóc chính mới.':
    'A caregiver account was deactivated, so {who} no longer has a primary caregiver. Please choose a new primary caregiver.',
  Người: 'Person',
  'Người lạ': 'Stranger',
  Ngựa: 'Horse',
  'Ngựa vằn': 'Zebra',
  'Nhận ra người quen': 'Recognised a familiar person',
  Nĩa: 'Fork',
  'Phát hiện {who} bị té ngã. Hãy kiểm tra ngay và mở VisionAid để phản hồi.':
    'A fall has been detected for {who}. Please check on them immediately and open VisionAid to respond.',
  Pizza: 'Pizza',
  'Quả bóng': 'Ball',
  Sách: 'Book',
  Thuyền: 'Boat',
  Thìa: 'Spoon',
  'Thông báo trên thiết bị': 'Device notification',
  Tivi: 'TV',
  'Trụ cứu hỏa': 'Fire hydrant',
  'Trực tiếp trên web': 'Live on the web',
  'Tàu hỏa': 'Train',
  Táo: 'Apple',
  'Túi xách': 'Handbag',
  'Tủ lạnh': 'Refrigerator',
  'Tự phát hiện té ngã': 'Fall detected automatically',
  Vali: 'Suitcase',
  'VisionAid — Cảnh báo khẩn cấp': 'VisionAid — Emergency alert',
  'VisionAid — Cần chọn người chăm sóc chính mới': 'VisionAid — New primary caregiver needed',
  'VisionAid — Phát hiện té ngã': 'VisionAid — Fall alert',
  'VisionAid — Ra khỏi vùng an toàn': 'VisionAid — Left the safe zone',
  'VisionAid — Thông báo mới': 'VisionAid — New notification',
  Voi: 'Elephant',
  'Ván lướt sóng': 'Surfboard',
  'Ván trượt': 'Skateboard',
  'Ván trượt tuyết': 'Skis',
  'Vợt tennis': 'Tennis racket',
  'Xe buýt': 'Bus',
  'Xe máy': 'Motorbike',
  'Xe tải': 'Truck',
  'Xe đạp': 'Bicycle',
  'Xúc xích kẹp': 'Hot dog',
  '{label}: {detail}': '{label}: {detail}',
  '{who} vừa gửi cảnh báo khẩn cấp. Hãy mở VisionAid ngay để tiếp nhận và phản hồi.':
    '{who} triggered an emergency. Please open VisionAid now to acknowledge and respond.',
  '{who} đã ra khỏi vùng an toàn.': '{who} has left the safe zone.',
  '{who} đã ra khỏi vùng an toàn "{zone}".': '{who} has left the safe zone "{zone}".',
  'Ô (dù)': 'Umbrella',
  'Ô tô': 'Car',
  'Đi tiếp': 'Go ahead',
  'Điều khiển từ xa': 'Remote control',
  'Đã bỏ qua': 'Dismissed',
  'Đã cảnh báo bằng giọng nói': 'Warned by voice',
  'Đã xử lý xong': 'Resolved',
  'Đèn giao thông': 'Traffic light',
  'Đĩa ném': 'Frisbee',
  'Đồng hồ': 'Clock',
  'Ảnh chụp hoặc màn hình, không phải người thật': 'A photo or screen, not a real person',
  'ở gần': 'nearby',
  'ở khoảng vừa': 'at a medium distance',
  'ở xa': 'far away',
  'Gia đình (Personal)': 'Family (Personal)',
  'Trung tâm (Business)': 'Center (Business)',
  'Số người dùng': 'Users',
  'Đóng điều hướng': 'Close navigation',
  '30 ngày qua': 'Last 30 days',
  'Báo cáo trung tâm': 'Center reports',
  'Bạn chưa có gói dịch vụ. Chọn gói để dùng đầy đủ chức năng.':
    'You have no plan yet. Choose a plan to use every feature.',
  'Chưa có người được chăm sóc. Thêm tài khoản hoặc nhận lời mời ở trang người dùng.':
    'No one in your care yet. Add an account or accept an invitation on the users page.',
  'Chưa có thao tác nào được ghi lại.': 'No actions recorded yet.',
  'Chưa có thông báo nào. Cảnh báo và tin nhắn hệ thống sẽ hiện ở đây.':
    'No notifications yet. Alerts and system messages will show here.',
  'Chưa có vị trí từ điện thoại': 'No location from the phone yet',
  'Chưa đọc được cảnh báo': 'Could not read alerts',
  'Chưa đọc được tình hình trung tâm': 'Could not read the center status',
  'Chưa đọc được tình trạng gửi thông báo': 'Could not read the notification delivery status',
  'Còn {days} ngày': '{days} days left',
  'Có cảnh báo': 'Has an alert',
  'Cảnh báo và hoạt động theo khoảng ngày.': 'Alerts and activity by date range.',
  'Cấp, thu hồi và mua thêm suất.': 'Assign, revoke and buy more seats.',
  'Cần để mắt tới': 'Needs a look',
  'Doanh thu theo ngày từ {from} đến {to}': 'Daily revenue from {from} to {to}',
  'Doanh thu tháng này': 'Revenue this month',
  'Doanh thu thực nhận': 'Net revenue',
  'Gia hạn hoặc đổi gói': 'Renew or change plan',
  'Gia đình trả phí': 'Paying families',
  'Giao dịch thành công': 'Successful payments',
  'Giá, thời hạn và tính năng của từng gói.': 'Price, duration and features of each plan.',
  'Gói của bạn': 'Your plan',
  'Gửi lỗi': 'Failed',
  'Gửi thông báo trong 7 ngày': 'Notifications sent in 7 days',
  'Hãy mở trung tâm cảnh báo để kiểm tra trực tiếp.': 'Open the alert center to check directly.',
  'Hết hạn lúc {time}.': 'Expires at {time}.',
  'Kho hết hạn': 'Pool expires',
  'Kho suất sử dụng': 'Seat pool',
  'Khóa, mở khóa và đặt lại mật khẩu.': 'Lock, unlock and reset passwords.',
  'Không ai trong trung tâm đang có cảnh báo mở.': 'No one in the center has an open alert.',
  'Không có cảnh báo nào đang mở trong phạm vi bạn chăm sóc.':
    'There are no open alerts for the people in your care.',
  'Kết quả nhận diện và đọc chữ theo ngày.': 'Recognition and text reading results by day.',
  'Lần nhận diện gương mặt': 'Face recognitions',
  'Lần đọc chữ': 'Text readings',
  'Mọi người đều ổn': 'Everyone is all right',
  'Mở bản đồ toàn trung tâm': 'Open the center map',
  'Mở bản đồ toàn trung tâm để kiểm tra trực tiếp.': 'Open the center map to check directly.',
  'Mở cảnh báo để xem vị trí và tiếp nhận. Sau 5 phút chưa ai tiếp nhận, hãy cân nhắc gọi 115.':
    'Open the alert to see the location and acknowledge it. If no one acknowledges within 5 minutes, consider calling 115.',
  'Mở hộp thư': 'Open inbox',
  'Mở trang theo dõi thông báo để kiểm tra trực tiếp.':
    'Open notification monitoring to check directly.',
  'Người thân của bạn': 'People in your care',
  'Người được gọi khi cần giúp đỡ.': 'Who gets called when help is needed.',
  'Suất còn trống': 'Free seats',
  'Suất đã cấp {used} trên {total}': '{used} of {total} seats assigned',
  'Số ngày còn lại': 'Days left',
  'Thao tác gần đây': 'Recent actions',
  'Thêm trung tâm, kho suất và quản trị viên.': 'Add centers, seat pools and administrators.',
  'Thông báo đang được gửi bình thường': 'Notifications are being delivered normally',
  'Thông tin liên hệ, mật khẩu và thông báo trình duyệt.':
    'Contact details, password and browser notifications.',
  'Trung tâm chưa có người khiếm thị đang hoạt động.':
    'The center has no active visually impaired users yet.',
  'Trung tâm trả phí': 'Paying centers',
  'Trung tâm đang yên ổn': 'All quiet at the center',
  'Tài khoản và phân công chăm sóc.': 'Accounts and care assignments.',
  'Tình hình những người bạn đang chăm sóc.': 'How the people in your care are doing.',
  'Tình hình toàn hệ thống hôm nay.': 'How the whole system is doing today.',
  'Tình hình trung tâm của bạn hôm nay.': 'How your center is doing today.',
  'Tổ chức và trung tâm': 'Organizations and centers',
  'Vật cản, dẫn đường, đọc chữ và nhận diện.':
    'Obstacles, navigation, text reading and recognition.',
  'Vị trí ghi nhận gần nhất của từng người.': 'The latest recorded location of each person.',
  'Vị trí trong 2 phút qua': 'Located in the last 2 minutes',
  'Vừa cập nhật': 'Just updated',
  'Xem báo cáo doanh thu': 'View revenue report',
  'Xem cảnh báo': 'View alert',
  'Xem thông báo lỗi': 'View failed notifications',
  'Xem trên bản đồ': 'View on map',
  'Xem {name}': 'View {name}',
  'trên {total} người': 'of {total} people',
  'trên {total} suất': 'of {total} seats',
  '{count} cảnh báo đang chờ bạn tiếp nhận': '{count} alerts waiting for you to acknowledge',
  '{count} cảnh báo đang được xử lý': '{count} alerts being handled',
  '{count} người đang có cảnh báo': '{count} people have an open alert',
  '{count} thông báo gửi lỗi trong 24 giờ qua': '{count} notifications failed in the last 24 hours',
  '{count} thông báo đang chờ gửi': '{count} notifications waiting to be sent',
  '{count} đang chờ': '{count} pending',
  'Đang hiện {shown} trên {total} người.': 'Showing {shown} of {total} people.',
  'Đang kiểm tra cảnh báo…': 'Checking alerts…',
  'Đang kiểm tra hệ thống…': 'Checking the system…',
  'Đang kiểm tra trung tâm…': 'Checking the center…',
  'Đang tìm vị trí…': 'Finding location…',
  'Đi nhanh tới': 'Go to',
  'Đã có người tiếp nhận. Theo dõi đến khi cảnh báo được xử lý xong.':
    'Someone has acknowledged it. Follow it until the alert is resolved.',
  'Đã gửi {sent} thông báo trong 24 giờ qua.': '{sent} notifications sent in the last 24 hours.',
  'Không có giao dịch đang chờ trong 10 giao dịch gần nhất.':
    'No pending payments among the 10 latest payments.',
  'Xem kho suất sử dụng': 'View seat pool',
  'Xem gói dịch vụ': 'View plan',
  'Gói của tôi': 'My plan',
  'Đã cấp {used} trên {total} suất': '{used} of {total} seats assigned',
  'Người chăm sóc chính luôn có đủ quyền.': 'A primary caregiver always has every permission.',
  'Người nhận chưa bật nhận thông báo trên thiết bị nào (trình duyệt ở trang Hồ sơ hoặc ứng dụng điện thoại).':
    'The recipient has not turned on notifications on any device (browser on the Profile page, or the phone app).',
  'Máy chủ chưa cấu hình dịch vụ thông báo đẩy (Firebase).':
    'The server has not configured the push notification service (Firebase).',
  'Thiết bị đã đăng ký không còn hợp lệ. Người nhận cần bật lại thông báo.':
    'The registered device is no longer valid. The recipient needs to turn notifications on again.',
  'Thiết bị đăng ký với dự án Firebase khác với máy chủ.':
    'The device is registered with a different Firebase project than the server.',
  'Người nhận chưa có địa chỉ email.': 'The recipient has no email address.',
  'Thông báo chưa tới được thiết bị. Thường là do chưa bật nhận thông báo trên trình duyệt hoặc ứng dụng điện thoại.':
    'The notification did not reach a device. Usually notifications are not turned on in the browser or the phone app.',
  'Bật thông báo để nhận cảnh báo té ngã ngay cả khi không mở trang VisionAid.':
    'Turn on notifications to get fall alerts even when VisionAid is not open.',
  'Bật thông báo': 'Turn on notifications',
  'Chưa bật được thông báo. Thử lại ở trang Hồ sơ.':
    'Could not turn on notifications. Try again on the Profile page.',
  'Trình duyệt đang chặn thông báo. Bấm biểu tượng bên trái thanh địa chỉ, chọn Cho phép thông báo rồi tải lại trang.':
    'The browser is blocking notifications. Click the icon left of the address bar, allow notifications, then reload the page.',
  'Để sau': 'Later',
  'Chặn nhận diện bằng ảnh chụp hoặc màn hình': 'Block recognition from photos or screens',
  'Dưới mức này (từ 0 đến 1), gương mặt bị xem là ảnh chụp hoặc màn hình.':
    'Below this level (0 to 1), a face is treated as a photo or a screen.',
  'Khi bật, nhận diện gương mặt từ chối khi camera đang thấy ảnh in hoặc màn hình, không phải người thật.':
    'When on, face recognition refuses when the camera sees a printed photo or a screen instead of a real person.',
  'Không kết nối được cổng thanh toán PayOS. Chưa có giao dịch nào được tạo. Vui lòng thử lại sau.':
    'Could not reach the PayOS payment gateway. No payment was created. Please try again later.',
  'Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau ít phút.':
    'The password cannot be reset right now. Please try again in a few minutes.',
  'Mức tin cậy người thật khi nhận diện gương mặt': 'Real-face confidence for face recognition',
  'Ảnh bị hỏng hoặc chưa tải đủ. Hãy chọn ảnh khác.':
    'The image is damaged or incomplete. Choose another image.',
  'Ảnh có độ phân giải quá lớn. Hãy chọn ảnh nhỏ hơn.':
    'The image resolution is too large. Choose a smaller image.',
  'Hệ thống tự gửi cảnh báo vì hết thời gian chờ hủy.':
    'The system sent the alert because the cancel window ended.',
  'Hệ thống gửi ngay vì cảnh báo do người dùng chủ động bấm, nói hoặc ra hiệu.':
    'Sent at once because the user raised it by button, voice or gesture.',
  'Người khiếm thị đã hủy cảnh báo.': 'The visually impaired user cancelled the alert.',
  '{m} phút': '{m} min',
  '{h} giờ {m} phút': '{h} h {m} min',
  '{h} giờ': '{h} h',
  '{d} ngày {h} giờ': '{d} d {h} h',
  '{d} ngày': '{d} d',
  'Chưa có ai tiếp nhận sau {elapsed}. Cân nhắc gọi 115.':
    'No one has acknowledged after {elapsed}. Consider calling 115.',
  'Còn {count} cảnh báo khác chưa có ai tiếp nhận, xem trong danh sách bên dưới.':
    '{count} more alerts have not been acknowledged; see the list below.',
  'Chọn tệp': 'Choose file',
  'Chưa chọn tệp nào': 'No file chosen',
  'Bắt đầu dẫn đường': 'Start navigation',
  'Dừng dẫn đường': 'Stop navigation',
  'Hỏi vị trí hiện tại': 'Ask current location',
  'Gọi khẩn cấp': 'Emergency call',
  'Chuyển chế độ tối giản': 'Switch to minimal mode',
  'Chuyển chế độ đầy đủ': 'Switch to full mode',
  'Báo đang ổn': 'Say I am OK',
  'Đọc nhanh hơn': 'Read faster',
  'Đọc chậm hơn': 'Read slower',
  'Đổi sang giọng nam': 'Switch to male voice',
  'Đổi sang giọng nữ': 'Switch to female voice',
  'Tăng âm lượng': 'Volume up',
  'Giảm âm lượng': 'Volume down',
  'Trợ giúp': 'Help',
  'Nhắc lại': 'Repeat',
  'Hỏi về hình ảnh': 'Ask about the picture',
  'Gọi người chăm sóc': 'Call caregiver',
  '"{spoken}" → {command}': '"{spoken}" → {command}',
  'Từ 0,5× (chậm) đến 2× (nhanh); 1× là tốc độ bình thường.':
    'From 0.5× (slow) to 2× (fast); 1× is normal speed.',
  'Giọng đọc khả dụng phụ thuộc điện thoại.': 'Available voices depend on the phone.',
  'Tiếng Việt': 'Vietnamese',
  'Tiếng Anh': 'English',
  'Giá trị đề xuất: giọng nữ, tốc độ 1×, âm lượng 80%, chế độ đầy đủ và tiếng Việt. Chỉ được lưu khi bạn xác nhận.':
    'Suggested values: female voice, speed 1×, volume 80%, full mode and Vietnamese. Saved only when you confirm.',
  'Không kết nối': 'Not connected',
  '{m} phút {s} giây': '{m} min {s} s',
  '{count} gói': '{count} plans',
  'Chỉ hiển thị các gói phù hợp với tài khoản của bạn.':
    'Only plans that fit your account are shown.',
  'Toàn bộ thời gian': 'All time',
  'Từ {from}': 'From {from}',
  'Đến {to}': 'Until {to}',
  '{from} đến {to}': '{from} to {to}',
  'Kênh và trạng thái': 'Channel and status',
  'Một trung tâm': 'A center',
  'Bộ xử lý': 'Engine',
  'Với số liệu dẫn đường, bản ghi thiếu thời gian phản hồi được tính là thất bại, kể cả khi bộ xử lý theo quy tắc đã đưa ra quyết định. Các số này không đánh giá độ đúng hoặc an toàn của hướng dẫn.':
    'For navigation figures, records without a response time count as failures, even when the rule-based engine gave a decision. These numbers do not judge whether the guidance was correct or safe.',
  'Dùng AI để mô tả hình ảnh': 'Use AI to describe pictures',
  'Khi bật, điện thoại dùng AI để mô tả, nhận biết và trả lời câu hỏi về hình ảnh; khi tắt chỉ đọc chữ.':
    'When on, the phone uses AI to describe, identify and answer questions about pictures; when off it only reads text.',
  'Thời gian chờ tối đa khi mô tả hình ảnh': 'Maximum wait for picture description',
  'Quá thời gian này, điện thoại chuyển sang chỉ đọc chữ trong ảnh.':
    'After this time, the phone falls back to reading the text in the picture.',
  'Số lần mô tả hình ảnh bằng AI mỗi ngày': 'AI picture descriptions per day',
  'Mỗi người khiếm thị được dùng AI tối đa số lần này mỗi ngày; sau đó chỉ đọc chữ.':
    'Each visually impaired user can use AI up to this many times a day; after that only text is read.',
  lần: 'times',
  'Nhập cả tên đăng nhập và mật khẩu (tối đa 200 ký tự), hoặc để trống cả hai để máy chủ tự cấp mật khẩu tạm cho mỗi cuộc gọi.':
    'Enter both a username and a password (up to 200 characters), or leave both empty so the server issues a temporary password for each call.',
  'Dùng mật khẩu cố định': 'Fixed password',
  'Mật khẩu tạm do máy chủ cấp mỗi cuộc gọi':
    'Temporary password issued by the server for each call',
  'Nhìn giúp tôi · {engine}': 'Look for me · {engine}',
  'AI Gemini': 'Gemini AI',
  'AI Groq': 'Groq AI',
  'không đọc được': 'nothing read',
  'Bản đồ theo dõi cả trung tâm': 'Map of the whole centre',
  'Bấm lọc để tìm mọi người có “{term}” trong tên hoặc email, hoặc chọn một người:':
    'Press filter to find everyone with “{term}” in their name or email, or pick one person:',
  'Chuyển tiếp cuộc gọi (TURN)': 'Call relay (TURN)',
  'Chuyển tiếp cuộc gọi': 'Call relay',
  'Chưa có máy chủ chuyển tiếp nào đang bật: cuộc gọi qua mạng 4G hoặc mạng công ty có thể không nối được.':
    'No relay server is switched on: calls over 4G or office networks may fail to connect.',
  'Chưa có máy chủ tìm đường nào đang bật: cuộc gọi có thể nối chậm hoặc không nối được.':
    'No route-finding server is switched on: calls may connect slowly or not at all.',
  'Do bên cung cấp máy chủ đưa, ví dụ stun:stun.l.google.com:19302 hoặc turn:ten-may-chu:3478.':
    'Given by the server provider, e.g. stun:stun.l.google.com:19302 or turn:server-name:3478.',
  'Dẫn đường bằng AI': 'AI navigation',
  'Gõ tên, email hoặc "Hệ thống"': 'Type a name, email or "System"',
  'Gọi thoại và video với người khiếm thị': 'Voice and video calls with the visually impaired user',
  'Gửi lại thông báo': 'Resend notification',
  'Hiện chỉ để ghi nhận trong gói; quản trị trung tâm vẫn luôn xem được bản đồ.':
    'Recorded in the package only for now; centre admins can always see the map.',
  'Hẹn đổi gói của kho suất sử dụng': 'Schedule a package change for the license pool',
  'Hủy hẹn đổi gói của kho suất sử dụng': 'Cancel the scheduled package change of the license pool',
  'Khôi phục tài khoản đã xóa': 'Restore deleted account',
  'Loại đối tượng': 'Object type',
  'Mật khẩu (chỉ cho máy chủ chuyển tiếp)': 'Password (relay servers only)',
  'Mọi hành động': 'All actions',
  'Mọi loại đối tượng': 'All object types',
  'Người chăm sóc gọi thoại hoặc video tới điện thoại của người khiếm thị.':
    "Caregivers make voice or video calls to the visually impaired user's phone.",
  'Số nhỏ được thử trước.': 'Lower numbers are tried first.',
  'Thông báo cảnh báo': 'Alert notification',
  'Thứ tự dùng': 'Order of use',
  'Thứ {priority}': 'No. {priority}',
  'Tên đăng nhập (chỉ cho máy chủ chuyển tiếp)': 'Username (relay servers only)',
  'Tìm đường kết nối (STUN)': 'Route finding (STUN)',
  'Tìm đường kết nối': 'Route finding',
  'Tất cả tổ chức': 'All organisations',
  'Xem liên kết giữa {caregiver} và {viu}': 'View the link between {caregiver} and {viu}',
  'Xóa gói dịch vụ': 'Delete package',
  'cổng {port}': 'port {port}',
  'giúp hai thiết bị tự nối thẳng với nhau khi mạng cho phép.':
    'helps the two devices connect directly when the network allows it.',
  'khi mạng chặn kết nối thẳng (mạng công ty, 4G), cuộc gọi đi vòng qua máy chủ này để vẫn nghe và thấy được.':
    'when the network blocks a direct connection (office networks, 4G), the call goes through this server so both sides can still hear and see each other.',
  'Đang bật {stun} máy chủ tìm đường và {turn} máy chủ chuyển tiếp: đủ để gọi.':
    '{stun} route-finding and {turn} relay servers are on: calls can connect.',
  'Điện thoại nhận hướng dẫn tránh vật cản từ máy chủ.':
    'The phone gets obstacle guidance from the server.',
  'Đổi tự động gia hạn kho suất sử dụng': 'Change automatic renewal of the license pool',
  'Nhận diện gương mặt (FaceNet)': 'Face recognition (FaceNet)',
  'Nhận lệnh giọng nói': 'Voice commands',
  'Đọc chữ (VietOCR)': 'Text reading (VietOCR)',
  'Phát hiện vật cản (YOLOv8n)': 'Obstacle detection (YOLOv8n)',
  'Dẫn đường bằng AI (JEV)': 'AI navigation (JEV)',
  'Dẫn đường bằng AI dự phòng (Groq)': 'Backup AI navigation (Groq)',
  'Dẫn đường theo quy tắc': 'Rule-based navigation',
  'Mọi mô hình': 'All models',
  'Chưa có thông tin gói dịch vụ': 'No package information yet',
  '{name} ({email}) sẽ bị đăng xuất khỏi mọi thiết bị và không nhận thông báo nữa. Quản trị viên hệ thống có thể khôi phục tài khoản trong {days} ngày.':
    '{name} ({email}) will be signed out on every device and stop receiving notifications. A system administrator can restore the account within {days} days.',
  '{name} ({email}) sẽ bị đăng xuất khỏi mọi thiết bị, không đăng nhập được và không nhận thông báo nữa.':
    '{name} ({email}) will be signed out on every device, cannot sign in and stops receiving notifications.',
  '{name} ({email}) sẽ đăng nhập lại được. Tổ chức của tài khoản cũng phải đang hoạt động.':
    "{name} ({email}) can sign in again. The account's organisation must also be active.",
  'Đã tạo liên kết chăm sóc.': 'Care link created.',
  'Đã tạo tài khoản cho {name}.': 'Account created for {name}.',
  'Xóa “{name}”?': 'Delete “{name}”?',
  '“{name}” ({code}) sẽ bị xóa vĩnh viễn và không khôi phục được. Chỉ xóa được gói chưa ai mua; gói đã bán hãy ngừng bán thay vì xóa.':
    '“{name}” ({code}) will be deleted permanently. Only packages nobody bought can be deleted; stop selling a sold package instead.',
  'Đã xóa “{name}”.': 'Deleted “{name}”.',
  'Xóa “{name}”': 'Delete “{name}”',
  'Đã lưu quy tắc thông báo.': 'Notification rule saved.',
  'Đã lưu máy chủ. Hãy thử một cuộc gọi để chắc chắn kết nối tốt.':
    'Server saved. Try a call to make sure it connects well.',
  'Trung tâm chưa mua gói': 'The centre has not bought a package',
  '{caregiver} chăm sóc {viu}': '{caregiver} cares for {viu}',
  '{caregiver} sẽ thành người chăm sóc chính của {viu}; người chăm sóc chính hiện tại chuyển thành phụ và giữ các quyền đang có.':
    '{caregiver} becomes the primary caregiver of {viu}; the current primary becomes secondary and keeps their permissions.',
  '{caregiver} sẽ không còn chăm sóc {viu}; tài khoản của hai người vẫn giữ nguyên. Nếu đây là người chăm sóc chính, người chăm sóc lâu nhất còn lại sẽ thành người chính.':
    '{caregiver} will no longer care for {viu}; both accounts stay. If this is the primary caregiver, the longest remaining caregiver becomes primary.',
  'Người bạn chăm sóc': 'People you care for',
  'Báo khi ra ngoài': 'Alert on leaving',
  'Báo khi đi vào và khi ra ngoài': 'Alert on entering and leaving',
  'Báo khi đi vào': 'Alert on entering',
  'Gõ địa chỉ, ví dụ 12 Nguyễn Trãi, Quận 5': 'Type an address, e.g. 12 Nguyen Trai, District 5',
  'Không gửi cảnh báo': 'No alerts',
  'Không thấy địa chỉ này. Thử gõ ngắn hơn hoặc bấm lên bản đồ.':
    'Address not found. Try fewer words or click on the map.',
  'Không tìm được địa chỉ lúc này. Hãy bấm trực tiếp lên bản đồ.':
    'Address search is unavailable right now. Click on the map instead.',
  'Không tải được bản đồ. Bạn vẫn có thể tìm địa chỉ hoặc nhập tọa độ.':
    'The map did not load. You can still search an address or enter coordinates.',
  'Kết quả tìm địa chỉ': 'Address results',
  'Nhập tọa độ (nếu bạn đã có)': 'Enter coordinates (if you have them)',
  'Tìm địa chỉ ở trên hoặc bấm lên bản đồ để đặt ghim.':
    'Search an address above or click on the map to drop a pin.',
  'Tìm địa chỉ': 'Search address',
  Tìm: 'Search',
  'Vị trí *': 'Location *',
  'Vị trí và bán kính': 'Location and radius',
  'Đã chọn một điểm trên bản đồ. Có thể kéo ghim để chỉnh cho đúng chỗ.':
    'A point is picked on the map. Drag the pin to adjust it.',
  'Đã chọn: {place}. Có thể kéo ghim để chỉnh cho đúng chỗ.':
    'Picked: {place}. Drag the pin to adjust it.',
  'Đã có {imageCount} ảnh. Cần thêm {missing} ảnh rõ mặt nữa để điện thoại nhận ra người này.':
    '{imageCount} photos so far. Add {missing} more clear face photos so the phone can recognise this person.',
  'Đã có {imageCount} ảnh, điện thoại đã nhận ra được người này. Nếu xóa bớt còn dưới {min} ảnh, việc nhận diện sẽ tạm dừng.':
    '{imageCount} photos: the phone can recognise this person. Deleting down to fewer than {min} photos pauses recognition.',
  'Đã xóa tài khoản. Muốn khôi phục trong {days} ngày: mở Bộ lọc, ở ô Tài khoản đã xóa chọn "Chỉ hiện tài khoản đã xóa", rồi bấm Chi tiết → Khôi phục tài khoản.':
    'Account deleted. To restore it within {days} days: open Filters, set Deleted accounts to "Only deleted accounts", then Details → Restore account.',
  'Đã xóa tài khoản. Quản trị viên hệ thống có thể khôi phục trong {days} ngày.':
    'Account deleted. A system administrator can restore it within {days} days.',
  'Bán kính phải là số nguyên trong khoảng cho phép.':
    'Radius must be a whole number within the allowed range.',
  'Email chưa đúng, ví dụ ten@gmail.com.': 'Email is not valid, e.g. name@gmail.com.',
  'Giá trị chưa hợp lệ.': 'This value is not valid.',
  'Hãy chọn loại liên hệ.': 'Choose a contact type.',
  'Hãy chọn tổ chức; chỉ quản trị viên hệ thống mới không thuộc tổ chức.':
    'Choose an organisation; only system administrators belong to none.',
  'Hãy chọn vai trò tài khoản.': 'Choose an account role.',
  'Hãy tìm địa chỉ hoặc bấm lên bản đồ để chọn vị trí.':
    'Search an address or click on the map to pick the location.',
  'Họ và tên cần từ 2 đến 200 ký tự.': 'Full name needs 2 to 200 characters.',
  'Lời nhắc tối đa 500 ký tự.': 'The reminder can have at most 500 characters.',
  'Mô tả quá dài.': 'The description is too long.',
  'Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.':
    'Password needs at least 8 characters with upper and lower case letters, a number and a special character.',
  'Nhập cả hai ô, hoặc để trống cả hai.': 'Fill in both fields, or leave both empty.',
  'Nhập liên kết Zalo, ví dụ https://zalo.me/0901234567.':
    'Enter a Zalo link, e.g. https://zalo.me/0901234567.',
  'Nhập số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.':
    'Enter a 10-digit Vietnamese mobile number starting with 03, 05, 07, 08 or 09.',
  'Nhập số điện thoại hợp lệ, ví dụ 0901 234 567 hoặc 115.':
    'Enter a valid phone number, e.g. 0901 234 567 or 115.',
  'Nhập tên (tối đa 200 ký tự).': 'Enter a name (at most 200 characters).',
  'Nhập tên liên hệ (tối đa 200 ký tự).': 'Enter a contact name (at most 200 characters).',
  'Thứ tự dùng là số nguyên từ 1 đến 1000.': 'Order of use is a whole number from 1 to 1000.',
  'Thứ tự ưu tiên là số nguyên từ 1 trở lên.': 'Priority is a whole number from 1 up.',
  'Vui lòng sửa các ô được tô đỏ.': 'Please fix the fields marked in red.',
  'Đường dẫn ảnh tối đa 500 ký tự.': 'The picture link can have at most 500 characters.',
  'Địa chỉ phải đúng loại máy chủ đã chọn và có cổng hợp lệ, ví dụ stun:stun.l.google.com:19302 hoặc turn:ten-may-chu:3478.':
    'The address must match the chosen server type and have a valid port, e.g. stun:stun.l.google.com:19302 or turn:server-name:3478.',
  'Người chăm sóc chính luôn có đủ quyền nên không chỉnh được. Muốn giới hạn quyền của người này, hãy chuyển một người chăm sóc khác thành người chính trước.':
    "The primary caregiver always has every permission, so these cannot be changed. To limit this person's permissions, make another caregiver primary first.",
  'Kiểm tra lại quy tắc rồi bấm Xác nhận lưu.': 'Check the rule, then press Confirm save.',
  'Xác nhận lưu': 'Confirm save',
  'Có thể gửi lại': 'Can be resent',
  'Gửi thành công lúc': 'Delivered at',
  'Lần gửi lại gần nhất': 'Last resent',
  'Số lần đã gửi lại': 'Times resent',
  'Vì sao không gửi lại được': 'Why it cannot be resent',
  'Bằng giọng nói': 'By voice',
  'Chạm màn hình': 'Screen tap',
  'Đã đến thiết bị': 'Reached the device',
  'Chờ kích hoạt': 'Awaiting activation',
  'Mạng di động': 'Mobile data',
  'SOS tự động': 'Automatic SOS',
  'Đang xem các thao tác trên một {table} cụ thể.': 'Showing the actions on one specific {table}.',
  'đối tượng': 'object',
  'Không hiển thị hình ảnh hay lời nói của người khiếm thị.':
    'Pictures and speech of the visually impaired user are never shown.',
  'Người dùng không còn trong hệ thống': 'User no longer in the system',
  '“Máy chủ (theo quy tắc)” và “Điện thoại tự quyết định” là khi AI đang tắt, trả lời chậm hoặc điện thoại mất mạng.':
    '“Server (rules)” and “Phone decided itself” mean AI was off, slow, or the phone was offline.',
  'Khi gọi, hai thiết bị cần một máy chủ giúp nối với nhau. Có hai loại:':
    'During a call, the two devices need a server to connect them. There are two kinds:',
  'Sau khi đổi, hãy thử một cuộc gọi.': 'After a change, try a call.',
  'Để trống cả tên đăng nhập và mật khẩu (nên dùng): hệ thống tự cấp mật khẩu tạm cho mỗi cuộc gọi. Máy chủ tìm đường không cần hai ô này.':
    'Leave both username and password empty (recommended): the system issues a temporary password for each call. Route-finding servers do not need these two fields.',
  'Tài khoản đã xóa': 'Deleted accounts',
  'Không hiện': 'Hide',
  'Chỉ hiện tài khoản đã xóa (để khôi phục)': 'Only deleted accounts (to restore)',
  'Hiện cả tài khoản đã xóa': 'Include deleted accounts',
  'Tổ chức đã xóa': 'Deleted organisations',
  'Chỉ hiện tổ chức đã xóa': 'Only deleted organisations',
  'Hiện cả tổ chức đã xóa': 'Include deleted organisations',
  'Tháng này': 'This month',
  'Tháng trước': 'Last month',
  'Toàn bộ': 'All time',
  'Kỳ báo cáo': 'Report period',
  'Một sự kiện có thể nằm ở nhiều ô, nên không cộng các ô lại với nhau.':
    'One event can appear in several boxes, so do not add the boxes together.',
  'Tùy chọn khoảng ngày': 'Custom date range',
  'Hãy chọn ít nhất một tệp.': 'Choose at least one file.',
  'Đã sao chép liên kết lời mời. Gửi liên kết này cho người được mời.':
    'Invitation link copied. Send it to the person you are inviting.',
  'Sao chép liên kết': 'Copy link',
  'Dán mã hoặc liên kết lời mời': 'Paste the invitation code or link',
  'Chọn ảnh QR JPG, PNG hoặc WebP dưới 5 MB.': 'Choose a JPG, PNG or WebP QR image under 5 MB.',
  'Bạn không thể tự nhận lời mời do chính mình tạo.':
    'You cannot accept an invitation you created yourself.',
  'Chỉ hẹn đổi được sang gói rẻ hơn. Gia hạn hoặc nâng cấp thì thanh toán trực tiếp.':
    'Only a cheaper package can be scheduled. Renewals and upgrades are paid directly.',
  'Cảnh báo này đã được tạo trước đó.': 'This alert was already created.',
  'Cổng thanh toán đang tạm ngưng nhận đơn. Chưa có tiền nào bị trừ. Vui lòng thử lại sau hoặc liên hệ quản trị hệ thống.':
    'The payment gateway is not taking orders right now. No money was charged. Please try again later or contact the system administrator.',
  'Dữ liệu vừa được thay đổi ở nơi khác. Hãy tải lại rồi thử lại.':
    'The data was just changed elsewhere. Reload and try again.',
  'Email hoặc mật khẩu không đúng.': 'Wrong email or password.',
  'Gói hiện tại không có tính năng này. Hãy nâng cấp gói.':
    'Your current package does not include this feature. Please upgrade.',
  'Gói mặc định của hệ thống không xóa được. Hãy ngừng bán nếu không dùng.':
    'System default packages cannot be deleted. Stop selling it if unused.',
  'Gói này rẻ hơn gói hiện tại nên chỉ đổi được vào cuối kỳ đã thanh toán. Hãy hẹn đổi gói.':
    'This package is cheaper than the current one, so it can only start at the end of the paid period. Schedule the change.',
  'Gói đã có người mua hoặc đang được dùng, hãy ngừng bán thay vì xóa.':
    'Someone bought or uses this package; stop selling it instead of deleting.',
  'Kho suất sử dụng này chưa có lịch đổi gói nào.':
    'This license pool has no scheduled package change.',
  'Kho suất sử dụng đã hết hạn. Hãy gia hạn gói trước khi cấp suất.':
    'The license pool has expired. Renew the package before assigning licenses.',
  'Khoảng ngày quá dài. Hãy chọn khoảng ngắn hơn.':
    'The date range is too long. Choose a shorter one.',
  'Không thể tự liên kết với chính mình.': 'You cannot link an account to itself.',
  'Không thực hiện được thao tác này. Hãy kiểm tra lại thông tin.':
    'This action could not be done. Check the information.',
  'Không thực hiện được. Vui lòng thử lại sau.': 'Could not be done. Please try again later.',
  'Không tìm thấy dữ liệu. Có thể nó đã bị xóa; hãy tải lại.':
    'Not found. It may have been deleted; reload.',
  'Lời mời không đúng, đã được dùng hoặc đã hết hạn. Hãy xin người mời tạo mã mới.':
    'The invitation is wrong, used or expired. Ask the inviter for a new code.',
  'Mã khôi phục không đúng hoặc đã hết hạn. Hãy yêu cầu email mới.':
    'The recovery code is wrong or expired. Request a new email.',
  'Mã kích hoạt này đã được một gia đình dùng nên không thu hồi được nữa.':
    'A family already used this activation code, so it can no longer be revoked.',
  'Mã kích hoạt này đã được thu hồi trước đó.': 'This activation code was already revoked.',
  'Mã kích hoạt vừa được dùng hoặc thay đổi trong lúc bạn thu hồi. Hãy tải lại danh sách.':
    'The activation code was used or changed while you revoked it. Reload the list.',
  'Mã kích hoạt đã hết hạn. Hãy xin trung tâm mã mới.':
    'The activation code has expired. Ask the centre for a new one.',
  'Mật khẩu mới phải khác mật khẩu hiện tại.': 'The new password must differ from the current one.',
  'Người này không có trong danh bạ gương mặt.': 'This person is not in the face registry.',
  'Phiên này đã kết thúc.': 'This session has ended.',
  'Thanh toán trực tuyến đang tạm ngưng. Vui lòng thử lại sau.':
    'Online payment is paused. Please try again later.',
  'Thông báo này đang được gửi lại, hãy chờ một chút.':
    'This notification is being resent; please wait.',
  'Thông tin chưa hợp lệ. Hãy kiểm tra lại các ô đã nhập.':
    'Some information is not valid. Check the fields you entered.',
  'Thông tin này đã tồn tại. Hãy kiểm tra lại để tránh tạo trùng.':
    'This already exists. Check to avoid a duplicate.',
  'Tài khoản cần thuộc một tổ chức.': 'The account must belong to an organisation.',
  'Tài khoản này chưa bị xóa nên không cần khôi phục.':
    'This account is not deleted, so there is nothing to restore.',
  'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên.':
    'The account is locked. Contact an administrator.',
  'Tài khoản đã bị xóa nên không đổi được trạng thái.':
    'The account is deleted, so its status cannot change.',
  'Tổ chức của tài khoản này đang bị vô hiệu hóa. Hãy kích hoạt lại tổ chức trước.':
    "This account's organisation is deactivated. Reactivate it first.",
  'Vui lòng nhập đủ các ô bắt buộc.': 'Please fill in all required fields.',
  'Đây có vẻ là ảnh chụp hoặc màn hình, không phải người thật.':
    'This looks like a photo or a screen, not a real person.',
  'Đã quá thời gian chờ hủy; cảnh báo khẩn cấp đã được gửi đi.':
    'The cancel window has passed; the emergency alert was sent.',
  'Đã quá thời hạn khôi phục tài khoản này.': 'The restore period for this account has passed.',
  'Ảnh bị hỏng hoặc không đúng định dạng. Hãy chọn ảnh khác.':
    'The image is damaged or in the wrong format. Choose another.',
  'Thứ tự ưu tiên này đã được dùng cho liên hệ khác. Chọn số khác.':
    'This priority is already used by another contact. Choose another number.',
  'Không lưu được tiến độ. Hãy làm xong bước 2 trước khi tải lại hoặc đóng trang.':
    'Could not save progress. Finish step 2 before reloading or closing the page.',
  'Bỏ bước liên kết': 'Skip linking',
  'Đã bỏ bước liên kết.': 'Linking skipped.',
  'Tài khoản vừa tạo': 'The account just created',
  '{who} vẫn còn trên hệ thống nhưng chưa có người chăm sóc. Nếu bỏ bước này, bạn cần nhờ quản trị viên liên kết giúp.':
    '{who} stays in the system without a caregiver. If you skip this step, ask an administrator to link it.',
  'Chưa chắc tài khoản đã được tạo. Hãy thử lại với cùng email; nếu báo email đã được đăng ký, hãy nhờ quản trị viên liên kết giúp.':
    'The account may not have been created. Try again with the same email; if it is already registered, ask an administrator to link it.',
  'Phía trước có bậc thềm,': 'Step ahead,',
  'cách khoảng 2 mét.': 'about 2 meters away.',
  'Người chăm sóc làm gì trên Web.': 'What caregivers do on the web.',
  'Mọi thao tác đều theo quyền mà người khiếm thị hoặc trung tâm đã cấp cho bạn.':
    'Everything follows the permissions the person you care for or the center has given you.',
  'Bắt đầu trong ba bước.': 'Get started in three steps.',
  'Dành cho gia đình và trung tâm.': 'For families and care centers.',
  'Liên kết người thân đầu tiên.': 'Link your first family member.',
  'Sau khi đăng ký, bạn liên kết với người khiếm thị và chọn quyền chăm sóc.':
    'After signing up, you link with the person you care for and choose care permissions.',
  'Trang Web dành cho người chăm sóc người khiếm thị.':
    'The web app for caregivers of people with visual impairments.',
  'Chăm sóc người thân khiếm thị từ xa.':
    'Look after a family member with visual impairment, from anywhere.',
  'Xem vị trí được chia sẻ, nhận cảnh báo khẩn cấp và quản lý thông tin hỗ trợ ở một nơi.':
    'See shared location, receive emergency alerts and manage support information in one place.',
  'Dữ liệu chỉ hiển thị theo quyền được cấp':
    'Data is shown only within the permissions you were given',
  'Quản lý tối đa 3 liên kết đang hoạt động.': 'Manage up to 3 active links.',
  'Gói dịch vụ đã hết hạn. Máy chủ báo còn {days} ngày gia hạn trước khi các chức năng bị khóa.':
    'Your license has expired. The server reports {days} grace days left before features are locked.',
  'Thanh toán trực tuyến đang tạm ngưng. Chưa có giao dịch nào được tạo. Vui lòng thử lại sau hoặc liên hệ quản trị hệ thống.':
    'Online payment is paused. No transaction was created. Please try again later or contact the system administrator.',
  'Hoạt động xử lý cảnh báo của người chăm sóc': 'Caregiver alert handling',
  'Các lần người chăm sóc của trung tâm đổi trạng thái cảnh báo. Thao tác của quản trị trung tâm không nằm trong danh sách này.':
    'Alert status changes made by the center’s caregivers. Center admin actions are not included.',
  'Tải lại hoạt động': 'Reload activity',
  'Đang lọc theo: {name}': 'Filtered by: {name}',
  'Bảng hoạt động xử lý cảnh báo': 'Alert handling table',
  'Thời điểm': 'Time',
  'Đổi trạng thái': 'Status change',
  '{from} → {to}': '{from} → {to}',
  'Chưa có hoạt động phù hợp.': 'No matching activity.',
  '{totalCount} hoạt động · Trang {page}/{pages}': '{totalCount} actions · Page {page}/{pages}',
  'Người chăm sóc đã chọn không hợp lệ.': 'The selected caregiver is not valid.',
  'Nhật ký trả về không khớp người chăm sóc đã chọn.':
    'The returned log does not match the selected caregiver.',
  'Chỉ quản trị trung tâm được xem bản đồ toàn trung tâm.':
    'Only center admins can view the organization map.',
  'An toàn': 'Safe',
  'Đang có cảnh báo chưa xử lý xong': 'Has an alert that is not closed yet',
  'Vị trí gần nhất của mọi người khiếm thị đang hoạt động trong trung tâm.':
    'Latest position of every active visually impaired user in the center.',
  'Lọc theo tình trạng cảnh báo': 'Filter by alert status',
  '{total} người khiếm thị · {alerts} đang có cảnh báo · Đang hiện {shown}':
    '{total} visually impaired users · {alerts} with an open alert · Showing {shown}',
  'Không có người khiếm thị phù hợp bộ lọc.': 'No visually impaired user matches this filter.',
  'Đang có cảnh báo': 'Open alert',
  'Chưa có vị trí': 'No position yet',
  '{name} · Đang có cảnh báo': '{name} · Open alert',
  'Vị trí hiện tại': 'Current location',
  'Loại cảnh báo': 'Alert type',
  Bạn: 'You',
  'Người dùng khác': 'Another user',
  'Xác nhận xử lý cảnh báo này? {p1}': 'Confirm handling this alert? {p1}',
  'chuyển sang': 'moved to',
  'Mã số thuế': 'Tax code',
  'Hết hạn {p0}': 'Expires {p0}',
  'Một tổ chức': 'An organization',
  'Đã có': 'Added',
  'Ảnh đại diện': 'Profile photo',
  'Gộp {gross} · hoàn {refunded}': 'Gross {gross} · refunded {refunded}',
  'Tỷ trọng': 'Share',
  'Xem bảng số liệu': 'Show data table',
  '{count} giao dịch': '{count} transactions',
  'Đã hoàn tiền {value}': 'Refunded {value}',
  'Cuộc gọi': 'Call',
  'Giao dịch thanh toán': 'Payment transaction',
  'Hướng dẫn di chuyển': 'Navigation guidance',
  'Người quen trong danh bạ gương mặt': 'Face registry person',
  'Nhận diện gương mặt': 'Face recognition',
  'Phiên phát hiện vật cản': 'Obstacle detection session',
  'Quét mã QR': 'QR scan',
  'Tổ chức của bạn': 'Your organization',
  'Đăng ký gói': 'Subscription',
  'Ảnh gương mặt': 'Face photo',
  'Xác nhận thay đổi': 'Confirm changes',
  'Kiểm tra lại các quyền sẽ được lưu cho liên kết này.':
    'Review the permissions that will be saved for this link.',
  'Kiểm tra lại các quyền của liên kết sắp tạo.':
    'Review the permissions of the link you are about to create.',
  'Thay đổi': 'Changed',
  'Quay lại chỉnh sửa': 'Back to editing',
  'Đang lưu…': 'Saving…',
  'Xác nhận lưu quyền': 'Confirm and save permissions',
  'Xác nhận tạo liên kết': 'Confirm and create link',
} satisfies Record<string, EnMessage>;
