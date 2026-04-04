package fr.revoicechat.moderation.repository;

import java.util.UUID;
import java.util.stream.Stream;

import fr.revoicechat.moderation.model.Sanction;
import fr.revoicechat.moderation.representation.SanctionFilterParams;

public interface SanctionRepository {

  Stream<Sanction> getSanctions(final UUID userId);

  Stream<Sanction> getSanctions(final UUID userId, UUID serverId);

  Stream<Sanction> findAll(SanctionFilterParams params);
}
