import UserSettingsController from "./user.settings.controller.js";
import {eraseCookie, statusToColor, statusToI18n} from "../lib/tools.js";
import MediaServer from "./media/media.server.js";
import CoreServer from "./core/core.server.js";
import PrivateRoomController from "./private.room.controller.js";
import {i18n} from "../lib/i18n.js";

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
            const userStatusElement = document.getElementById("user-status");
            userStatusElement.dataset.i18n = statusToI18n(this.activeStatus);
            i18n.translateElement(userStatusElement);
            const color = statusToColor(this.activeStatus);
            document.getElementById("user-dot").setAttribute('color', color);
            document.getElementById("user-status-trigger-dot").innerHTML = `<revoice-status-dot-${color}></revoice-status-dot-${color}>`;

            const userPicture = document.getElementById("user-picture");
            userPicture.src = MediaServer.profiles(this.id);
            userPicture.dataset.id = this.id;
        }

        await this.settings.load();
        await this.privateRooms.load();

        const popover = document.getElementById('user-popover');
        const anchor = document.getElementById("user-popover-container");

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

        const subPopover = document.getElementById('user-status-popover');
        const subPopoverAnchor = document.getElementById("user-status-trigger");

        subPopoverAnchor.addEventListener('click', () => {
            subPopover.showPopover();
            popover.showPopover();
            subPopover.classList.remove('hidden');
        });

        subPopover.addEventListener('beforetoggle', (e) => {
            if (e.newState === 'open') {
                const rect = subPopoverAnchor.getBoundingClientRect();
                subPopover.style.left = `${rect.right+8}px`;
                subPopover.style.bottom = `${window.innerHeight - rect.bottom}px`;
            } else if (e.newState === 'closed') {
                popover.togglePopover();
            }
        });

        document.querySelectorAll('.change-status').forEach(button => {
            button.addEventListener('click', async () => {
                /** {@type ActiveStatus} */
                const status = button.dataset.userStatus;
                subPopover.togglePopover();
                await CoreServer.fetch(`/user/me`, 'PATCH', {status: status});
                this.setStatus({
                    userId: result.id,
                    status: status
                });
            })
        })

        document.addEventListener('click', (e) => {
            if (popover.matches(':popover-open') &&
                !popover.contains(e.target) &&
                !anchor.contains(e.target)) {
                popover.hidePopover();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popover.matches(':popover-open')) {
                popover.hidePopover();
            }
        });
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
        if(this.id === id) {
            this.activeStatus = data.status;
            const userStatusElement = document.getElementById("user-status");
            userStatusElement.dataset.i18n = statusToI18n(this.activeStatus);
            i18n.translateElement(userStatusElement);
            const color = statusToColor(data.status);
            document.getElementById("user-dot").setAttribute('color', color);
            document.getElementById("user-status-trigger-dot").innerHTML = `<revoice-status-dot-${color}></revoice-status-dot-${color}>`;
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