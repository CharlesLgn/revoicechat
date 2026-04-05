package fr.revoicechat.core.repository.impl.room;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import fr.revoicechat.core.model.User;
import fr.revoicechat.core.model.room.PrivateMessageRoom;
import fr.revoicechat.core.model.room.ServerRoom;
import fr.revoicechat.core.repository.RoomRepository;
import fr.revoicechat.core.service.room.RoomAccessVerifier;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;

@ApplicationScoped
public class AccessibleRoomsResolver {

  private final EntityManager entityManager;
  private final RoomAccessVerifier roomAccessVerifier;
  private final RoomRepository roomRepository;

  public AccessibleRoomsResolver(EntityManager entityManager,
                                 RoomAccessVerifier roomAccessVerifier,
                                 RoomRepository roomRepository) {
    this.entityManager = entityManager;
    this.roomAccessVerifier = roomAccessVerifier;
    this.roomRepository = roomRepository;
  }

  public Set<UUID> resolve(UUID currentUserId, UUID roomId) {
    return roomId != null
           ? resolveForSpecificRoom(currentUserId, roomId)
           : resolve(currentUserId);
  }

  public Set<UUID> resolveForSpecificRoom(final UUID currentUserId, final UUID roomId) {
    var serverRoom = entityManager.find(ServerRoom.class, roomId);
    if (serverRoom != null) {
      return roomAccessVerifier.verify(currentUserId, serverRoom) ? Set.of(roomId) : Set.of();
    }
    var privateMessageRoom = entityManager.find(PrivateMessageRoom.class, roomId);
    return verify(privateMessageRoom, currentUserId) ? Set.of(roomId) : Set.of();
  }

  private boolean verify(final PrivateMessageRoom privateMessageRoom, final UUID currentUserId) {
    return privateMessageRoom != null && privateMessageRoom.getUsers()
                                                           .stream()
                                                           .map(User::getId)
                                                           .anyMatch(currentUserId::equals);
  }

  public Set<UUID> resolve(UUID currentUserId) {
    return roomRepository.findRoomsByUserServers(currentUserId)
                         .filter(room -> roomAccessVerifier.verify(currentUserId, room))
                         .map(ServerRoom::getId)
                         .collect(Collectors.toSet());
  }
}
