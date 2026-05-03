package fr.revoicechat.core.technicaldata.user;

import fr.revoicechat.security.model.UserType;

public record AdminUpdatableUserData(String displayName, UserType type) {}
