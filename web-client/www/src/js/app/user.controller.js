import UserSettingsController from "./user.settings.controller.js";
import {eraseCookie, statusToColor} from "../lib/tools.js";
import MediaServer from "./media/media.server.js";
import CoreServer from "./core/core.server.js";
import PrivateRoomController from "./private.room.controller.js";

export default class UserController {
    /** @type {SanctionRepresentation[]} */
    sanctions
    /** @type {UserSettingsController} */
    settings;
    /** @type {string} */
    id;
    /** @type {string} */
    login;
    /** @type {string} */
    displayName;
    /** @type {ActiveStatus} */
    activeStatus;
    /** @type {string} */
    #type;
    /** @type {PrivateRoomController} */
    privateRooms;

    constructor() {
        this.privateRooms = new PrivateRoomController(this)
        this.settings = new UserSettingsController(this);
    }

    async load() {
        /** @type {UserRepresentation} */
        const result = await CoreServer.fetch(`/user/me`, 'GET');

        if (result !== null) {
            this.id = result.id;
            this.login = result.login;
            this.displayName = result.displayName;
            this.#type = result.type;
            this.activeStatus = result.status;
            this.sanctions = await CoreServer.fetch(`/sanctions?userId=${this.id}&active=true`);
            
            document.getElementById("status-container").classList.add(this.id);
            document.getElementById("user-name").innerText = this.displayName;
            document.getElementById("user-status").innerText = this.activeStatus;
            document.getElementById("user-dot").setAttribute('color', statusToColor(this.activeStatus));

            const userPicture = document.getElementById("user-picture");
            userPicture.src = MediaServer.profiles(this.id);
            userPicture.dataset.id = this.id;
        }

        await this.settings.load();
        await this.privateRooms.load();

        const popover = document.getElementById('user-status-popover');
        const anchor = document.getElementById('user-status-container');
        anchor.addEventListener('click', () => {
            popover.togglePopover();
            popover.classList.remove('hidden');
        });
        popover.addEventListener('beforetoggle', (e) => {
            if (e.newState === 'open') {
                const rect = anchor.getBoundingClientRect();
                popover.style.left = `${rect.left}px`;
                popover.style.bottom = `${window.innerHeight - rect.top + 8}px`; // 8px gap above
            }
        });

        document.querySelectorAll('.change-status-button').forEach(button => {
            button.addEventListener('click', async () => {
                /** {@type ActiveStatus} */
                const status = button.dataset.userStatus;
                popover.togglePopover();
                await CoreServer.fetch(`/user/me`, 'PATCH', {status: status});
                this.setStatus({
                    userId: result.id,
                    status: status
                });
            })
        })
    }

    /** @param {UserRepresentation} data */
    update(data) {
        const id = data.id;
        const name = data.displayName;
        const status = data.status;
        const picture = MediaServer.profiles(id);

        // Static elements for self
        if(this.id === id){
            // Main page
            document.getElementById("user-name").innerText = name;
            document.getElementById("user-picture").src = picture;
            // User settings
            document.getElementById('settings-user-login').innerText = data.login;
            document.getElementById('settings-user-name').value = name;
            document.getElementById('setting-user-picture').src = picture;
            this.setStatus({userId: id, status: status})
        }

        // Dynamic elements
        for (const icon of document.getElementsByName(`user-picture-${id}`)) {
            icon.src = picture;
        }
        for (const name of document.getElementsByName(`user-name-${id}`)) {
            name.innerText = data.displayName;
        }
    }

    isAdmin(){
        return (this.#type === "ADMIN");
    }

    /** @param {UserStatusUpdate} data */
    setStatus(data){
        const id = data.userId;
        const color = statusToColor(data.status);
        if(this.id === id) {
            this.activeStatus = data.status;
            document.getElementById("user-dot").setAttribute('color', color);
        }
    }

    logout(){
        CoreServer.fetch(`/auth/logout`, 'GET').then(() => {
            sessionStorage.removeItem('lastState');
            localStorage.removeItem('userSettings');
            eraseCookie('jwtToken');
            document.location.href = `index.html`;
        });
    }
}