export default class MobileController {

  static load() {
    const toggleSidebars = document.querySelectorAll('.toggleSidebar');
    const toggleUsers = document.getElementById('toggleUsers');
    const sidebarServers = document.querySelector('.sidebar.instances-list');
    const sidebarsRooms = document.querySelectorAll('.sidebar.togglable');
    const sidebarRight = document.getElementById('sidebar-users');
    const configSidebars = document.querySelectorAll('.config-container-left');
    const overlays = document.querySelectorAll('.overlay');

    for (const toggleSidebar of toggleSidebars) {
      toggleSidebar.addEventListener('click', () => {
        sidebarServers.classList.toggle('show');
        for (const sidebarRooms of sidebarsRooms) {
          sidebarRooms.classList.toggle('show');
        }
        sidebarRight.classList.remove('show');
        for (const configSidebar of configSidebars) {
          configSidebar.classList.toggle('show');
        }
        for (const overlay of overlays) {
          overlay.classList.toggle('show');
        }
      });
    }

    toggleUsers.addEventListener('click', () => {
      sidebarRight.classList.toggle('show');
      sidebarServers.classList.remove('show');
      for (const sidebarRooms of sidebarsRooms) {
        sidebarRooms.classList.remove('show');
      }
      for (const configSidebar of configSidebars) {
        configSidebar.classList.toggle('show');
      }
      for (const overlay of overlays) {
        overlay.classList.toggle('show');
      }
    });

    for (const overlay of overlays) {
      overlay.addEventListener('click', () => {
        sidebarServers.classList.remove('show');
        for (const sidebarRooms of sidebarsRooms) {
          sidebarRooms.classList.remove('show');
        }
        sidebarRight.classList.remove('show');
        for (const configSidebar of configSidebars) {
          configSidebar.classList.remove('show');
        }
        for (const otherOverlay of overlays) {
          otherOverlay.classList.remove('show');
        }
        overlay.classList.remove('show');
      });
    }
  }
}