from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Liste de templates pour générer des lettres de motivation "intelligentes"
MOTIVATION_TEMPLATES = [
    "Passionné(e) par {domaine}, j'ai eu l'opportunité de développer mes compétences en {competence1} et {competence2}. Mon expérience en {experience} m'a permis de comprendre les enjeux de notre club.",
    "Mon engagement au sein de l'association pendant {annees} ans m'a convaincu de ma capacité à {objectif}. Je souhaite mettre mon énergie au service de {projet}.",
    "Je suis convaincu(e) que notre club peut atteindre de nouveaux sommets. Avec mon expérience en {competence1}, je propose de {action} pour dynamiser notre communauté."
]

PROGRAM_TEMPLATES = [
    "1. Développer la visibilité du club sur les réseaux sociaux\n2. Organiser des événements mensuels pour fédérer les membres\n3. Créer des partenariats avec d'autres associations\n4. Mettre en place des ateliers de formation",
    "1. Renforcer la cohésion d'équipe avec des activités régulières\n2. Améliorer la communication interne\n3. Lancer des projets innovants\n4. Augmenter le nombre de membres actifs",
    "1. Moderniser les outils de gestion du club\n2. Créer un programme de mentorat\n3. Organiser des conférences avec des professionnels\n4. Développer des projets à impact social"
]

COMPETENCES = {
    "communication": ["communication", "réseaux sociaux", "relations publiques"],
    "organisation": ["organisation d'événements", "gestion de projet", "logistique"],
    "leadership": ["leadership", "gestion d'équipe", "prise de décision"],
    "technique": ["développement", "analyse", "innovation"],
    "créativité": ["créativité", "design", "marketing"]
}

@app.route('/generate/motivation-letter', methods=['POST'])
def generate_motivation_letter():
    """Endpoint pour générer une lettre de motivation"""
    try:
        data = request.json
        logging.info(f"Requête reçue: {data}")
        
        candidate_name = data.get('candidateName', 'Candidat')
        club_name = data.get('clubName', 'ClubHub')
        position = data.get('position', 'Membre')
        user_ideas = data.get('userIdeas', '').lower()
        
        # Extraire les mots-clés des idées utilisateur
        keywords = []
        for key in COMPETENCES:
            if key in user_ideas or any(comp in user_ideas for comp in COMPETENCES[key]):
                keywords.append(key)
        
        if not keywords:
            keywords = ['communication', 'organisation']
        
        # Sélectionner les compétences
        selected_skills = []
        for k in keywords[:3]:
            selected_skills.extend(COMPETENCES.get(k, COMPETENCES['communication'])[:2])
        
        # Limiter à 5 compétences uniques
        selected_skills = list(set(selected_skills))[:5]
        
        # Générer la lettre
        template = random.choice(MOTIVATION_TEMPLATES)
        letter_body = template.format(
            domaine=random.choice(['la communication', 'l\'organisation', 'le développement', 'le leadership']),
            competence1=selected_skills[0] if len(selected_skills) > 0 else "la communication",
            competence2=selected_skills[1] if len(selected_skills) > 1 else "le travail en équipe",
            experience=random.choice(['2 ans', 'plusieurs projets', 'mon parcours académique']),
            annees=random.choice(['2', '3']),
            objectif=random.choice(['fédérer les membres', 'développer le club', 'innover']),
            projet=random.choice(['la prochaine édition du hackathon', 'les ateliers mensuels', 'les partenariats']),
            action=random.choice(['lancer des ateliers', 'organiser des meetups', 'créer du contenu'])
        )
        
        motivation_letter = f"Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de {position} au sein de {club_name}.\n\n{letter_body}\n\nJe reste à votre disposition pour tout complément d'information.\n\nCordialement,\n{candidate_name}"
        
        # Générer un programme
        program = random.choice(PROGRAM_TEMPLATES)
        
        response = {
            'motivationLetter': motivation_letter,
            'program': program,
            'skills': selected_skills,
            'generatedAt': '2024-01-01T00:00:00'
        }
        
        logging.info(f"Réponse générée avec succès")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Erreur: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate/program', methods=['POST'])
def generate_program():
    """Endpoint pour générer un programme"""
    try:
        data = request.json
        logging.info(f"Requête programme reçue: {data}")
        
        club_name = data.get('clubName', 'ClubHub')
        objectives = data.get('objectives', '')
        
        program = random.choice(PROGRAM_TEMPLATES)
        
        response = {
            'program': program,
            'generatedAt': '2024-01-01T00:00:00'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Erreur: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate_legacy():
    """Endpoint legacy pour compatibilité"""
    return generate_motivation_letter()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'template-based-generator',
        'local': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)