document.addEventListener('DOMContentLoaded', function () {
    fetchUsers();
    loadRoles();
    setupCloseButtons();
});

// Функция для получения и отображения всех пользователей
function fetchUsers() {
    console.log('Fetching users...');
    fetch('/admin/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        })
        .then(users => {
            console.log('Users fetched:', users);
            const tableBody = document.getElementById('users-table-body');
            tableBody.innerHTML = ''; // Очищаем существующие строки

            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.firstName}</td>
                    <td>${user.lastName}</td>
                    <td>${user.age}</td>
                    <td>${user.email}</td>
                    <td>${user.authorities.map(role => role.authority).join(', ')}</td>
                    <td><button class="btn btn-info" onclick="openEditUserPopup(${user.id})">Edit</button></td>
                    <td><button class="btn btn-danger" onclick="openDeleteUserPopup(${user.id})">Delete</button></td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            alert('Ошибка при загрузке пользователей');
        });
}

// Функция для загрузки всех ролей и отображения их в селектах
function loadRoles() {
    console.log('Loading roles...');
    fetch('/admin/users/roles')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch roles');
            }
            return response.json();
        })
        .then(roles => {
            console.log('Roles fetched:', roles);
            const roleSelect = document.getElementById('roles');
            const editRoleSelect = document.getElementById('editRoles');

            roleSelect.innerHTML = ''; // Очищаем существующие опции
            editRoleSelect.innerHTML = '';

            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.text = role.authority; // Предполагается, что поле называется 'authority'
                roleSelect.appendChild(option);

                const editOption = document.createElement('option');
                editOption.value = role.id;
                editOption.text = role.authority;
                editRoleSelect.appendChild(editOption);
            });
        })
        .catch(error => {
            console.error('Error loading roles:', error);
            alert('Ошибка при загрузке ролей');
        });
}

// Обработчик отправки формы создания нового пользователя
document.getElementById('new-user-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const rolesSelected = Array.from(document.getElementById('roles').selectedOptions).map(option => ({
        id: parseInt(option.value, 10)
    }));

    const user = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        age: parseInt(formData.get('age'), 10),
        email: formData.get('email'),
        password: formData.get('password'),
        roles: rolesSelected
    };

    console.log('Creating user:', user);

    fetch('/admin/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
        .then(response => {
            if (response.ok) {
                fetchUsers();
                alert('Пользователь успешно создан!');
                this.reset();
                closeModal('newUserPopup');
            } else {
                return response.json().then(data => {
                    throw new Error(data.message || 'Не удалось создать пользователя');
                });
            }
        })
        .catch(error => {
            console.error('Error creating user:', error);
            alert('Ошибка при создании пользователя: ' + error.message);
        });
});

// Функция для открытия модального окна редактирования пользователя и заполнения формы
function openEditUserPopup(userId) {
    console.log('Opening edit modal for user ID:', userId);
    fetch(`/admin/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            return response.json();
        })
        .then(user => {
            console.log('User fetched for edit:', user);
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editFirstName').value = user.firstName;
            document.getElementById('editLastName').value = user.lastName;
            document.getElementById('editAge').value = user.age;
            document.getElementById('editEmail').value = user.email;

            const editRolesSelect = document.getElementById('editRoles');
            Array.from(editRolesSelect.options).forEach(option => {
                option.selected = user.authorities.some(role => role.id === parseInt(option.value, 10));
            });

            openModal('editUserModal');
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            alert('Ошибка при загрузке данных пользователя');
        });
}

// Обработчик отправки формы редактирования пользователя
document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const userId = parseInt(formData.get('id'), 10);
    const rolesSelected = Array.from(document.getElementById('editRoles').selectedOptions).map(option => ({
        id: parseInt(option.value, 10)
    }));

    const user = {
        id: userId,
        firstName: formData.get('editFirstName'),
        lastName: formData.get('editLastName'),
        age: parseInt(formData.get('editAge'), 10),
        email: formData.get('editEmail'),
        roles: rolesSelected
    };

    console.log('Updating user:', user);

    fetch('/admin/users', { // Соответствует вашему контроллеру
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
        .then(response => {
            if (response.ok) {
                fetchUsers();
                alert('Пользователь успешно обновлен!');
                closeModal('editUserModal');
            } else {
                return response.json().then(data => {
                    throw new Error(data.message || 'Не удалось обновить пользователя');
                });
            }
        })
        .catch(error => {
            console.error('Error updating user:', error);
            alert('Ошибка при обновлении пользователя: ' + error.message);
        });
});

// Функция для удаления пользователя
function openDeleteUserPopup(userId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        console.log('Deleting user ID:', userId);
        fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    fetchUsers();
                    alert('Пользователь успешно удалён!');
                } else {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Не удалось удалить пользователя');
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                alert('Ошибка при удалении пользователя: ' + error.message);
            });
    }
}

// Функция для открытия модального окна
function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Функция для закрытия модального окна
function closeModal(modalId) {
    console.log('Closing modal:', modalId);
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Функция для установки обработчиков закрытия модальных окон
function setupCloseButtons() {
    const closeButtons = document.querySelectorAll('.close-popup');
    closeButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // Закрытие модальных окон при клике на оверлей
    const overlay = document.getElementById('overlay');
    overlay.addEventListener('click', function () {
        const modals = document.querySelectorAll('.popup');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        this.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}