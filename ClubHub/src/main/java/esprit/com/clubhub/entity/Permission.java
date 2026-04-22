package esprit.com.clubhub.entity;

public enum Permission {
    // Gestion des membres
    VIEW_MEMBERS("Voir les membres", "Permet de consulter la liste des membres du club"),
    ADD_MEMBERS("Ajouter des membres", "Permet d'ajouter de nouveaux membres au club"),
    EDIT_MEMBERS("Modifier les membres", "Permet de modifier les informations des membres"),
    DELETE_MEMBERS("Supprimer des membres", "Permet de supprimer des membres du club"),
    APPROVE_MEMBERS("Approuver les membres", "Permet d'approuver les demandes d'adhésion"),
    
    // Gestion des comités
    VIEW_COMMITTEES("Voir les comités", "Permet de consulter les comités du club"),
    CREATE_COMMITTEES("Créer des comités", "Permet de créer de nouveaux comités"),
    EDIT_COMMITTEES("Modifier les comités", "Permet de modifier les comités existants"),
    DELETE_COMMITTEES("Supprimer des comités", "Permet de supprimer des comités"),
    ASSIGN_TO_COMMITTEES("Assigner aux comités", "Permet d'assigner des membres aux comités"),
    
    // Gestion des élections
    VIEW_ELECTIONS("Voir les élections", "Permet de consulter les élections"),
    CREATE_ELECTIONS("Créer des élections", "Permet de créer de nouvelles élections"),
    EDIT_ELECTIONS("Modifier les élections", "Permet de modifier les élections"),
    DELETE_ELECTIONS("Supprimer des élections", "Permet de supprimer des élections"),
    VOTE_ELECTIONS("Voter aux élections", "Permet de voter lors des élections"),
    VALIDATE_ATTENDANCE("Valider la présence", "Permet de valider la présence aux élections"),
    VIEW_RESULTS("Voir les résultats", "Permet de consulter les résultats des élections"),
    
    // Gestion des rôles
    VIEW_ROLES("Voir les rôles", "Permet de consulter les rôles personnalisés"),
    CREATE_ROLES("Créer des rôles", "Permet de créer de nouveaux rôles personnalisés"),
    EDIT_ROLES("Modifier les rôles", "Permet de modifier les rôles personnalisés"),
    DELETE_ROLES("Supprimer des rôles", "Permet de supprimer des rôles personnalisés"),
    ASSIGN_ROLES("Assigner des rôles", "Permet d'assigner des rôles aux membres"),
    
    // Gestion du club
    VIEW_CLUB("Voir le club", "Permet de consulter les informations du club"),
    EDIT_CLUB("Modifier le club", "Permet de modifier les informations du club"),
    DELETE_CLUB("Supprimer le club", "Permet de supprimer le club"),
    
    // Gestion des événements
    VIEW_EVENTS("Voir les événements", "Permet de consulter les événements"),
    CREATE_EVENTS("Créer des événements", "Permet de créer de nouveaux événements"),
    EDIT_EVENTS("Modifier les événements", "Permet de modifier les événements"),
    DELETE_EVENTS("Supprimer des événements", "Permet de supprimer des événements"),
    
    // Permissions administratives
    MANAGE_PERMISSIONS("Gérer les permissions", "Permet de gérer les permissions des rôles"),
    VIEW_ANALYTICS("Voir les statistiques", "Permet de consulter les statistiques du club"),
    SEND_NOTIFICATIONS("Envoyer des notifications", "Permet d'envoyer des notifications aux membres");

    private final String label;
    private final String description;

    Permission(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public String getCode() {
        return this.name();
    }
}
