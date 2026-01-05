"""
ICF Guru Prompt Templates.

This module contains 25 laser-focused prompt templates for ICF subsection generation.
Each prompt is designed to extract the best possible content from Gemini for a specific subsection.
"""

import json
from typing import Dict
from .icf_guru_subsections import SubsectionDefinition


class ICFPromptBuilder:
    """
    Builds focused prompts for each ICF subsection.

    Each of the 25 subsections has a custom-tailored prompt designed
    to extract the best possible content from Gemini.
    """

    # Plain language substitutions (shared across all prompts)
    PLAIN_LANGUAGE_MAP = {
        "adverse event": "side effect",
        "randomized": "assigned by chance",
        "placebo": "inactive substance",
        "double-blind": "neither you nor your doctor knows",
        "intravenous": "through a vein",
        "subcutaneous": "under the skin",
        "intramuscular": "into the muscle",
        "oral": "by mouth",
        "efficacy": "effectiveness",
        "indication": "condition",
        "contraindication": "reason not to take",
        "pharmacokinetics": "how the drug moves through your body",
        "pharmacodynamics": "how the drug affects your body",
        "biomarker": "blood marker",
        "endpoint": "measure of success",
        "protocol": "study plan",
        "investigator": "study doctor",
        "participant": "you",
        "subject": "you",
    }

    # Prompt templates for each subsection
    PROMPT_TEMPLATES = {
        # Structural subsections are handled programmatically (document_header, contact_information, signature_page)

        "invitation_to_participate": """You are an FDA-compliant ICF writer.

TASK: Write a warm, inviting 1-2 paragraph invitation to participate in the research study.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Welcoming, respectful tone
- Explain that this is a research study
- Emphasize that participation is voluntary
- Encourage reading the form carefully before deciding
- Use "you" and "your" throughout
- Write 1-2 paragraphs
- NO pressure or coercion

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"You are invited to take part in a research study testing a new treatment for heart failure. Before you decide whether to join, it is important that you understand why the research is being done and what it will involve.

Please take time to read this form carefully. Feel free to ask questions about anything that is unclear. Your decision to participate is entirely voluntary."

Now write the invitation:
""",

        "introduction_preamble": """You are an FDA-compliant ICF writer.

TASK: Write a 2-paragraph introduction explaining that this is a research study consent form.

REQUIREMENTS:
- Emphasize voluntary participation
- Encourage asking questions
- Use "you" and "your" throughout
- Write exactly 2 paragraphs
- Warm, welcoming, non-coercive tone

OUTPUT: 2 paragraphs.

EXAMPLE QUALITY:
"You are being asked to take part in a research study. This form gives you important information about the study. Please read it carefully and take your time. Ask your study doctor or study staff to explain anything you do not understand.

You can ask questions at any time. Taking part in this study is your choice. You do not have to join if you do not want to."

Now write the introduction:
""",

        "study_purpose_overview": """You are an FDA-compliant ICF writer explaining the study purpose.

TASK: Write 3 brief paragraphs (MAX 120 WORDS TOTAL) explaining WHY this study is being done.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Paragraph 1: Condition + drug is investigational (30-40 words)
- Paragraph 2: Phase explanation OR investigational nature (25-35 words)
- Paragraph 3: Participation optional, other options exist (15-25 words)
- 3 paragraphs, MAX 120 words total

OUTPUT: 3 paragraphs, 120 words max.

EXAMPLE QUALITY (with phase):
"This study is testing XYZ-2000 for heart failure. Heart failure means your heart does not pump blood well. XYZ-2000 is an investigational medicine not yet approved by the FDA.

This is a Phase 3 study. The drug was tested in smaller groups. Now we are testing it in a larger group to see how well it works.

You do not have to join this study to get treatment. Your doctor can explain other options."

Now write the study purpose section:
""",

        "study_purpose_learnings": """You are an FDA-compliant ICF writer explaining what researchers hope to learn.

TASK: Write 2 brief paragraphs (MAX 80 WORDS TOTAL) on what the study will measure.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Paragraph 1: Main measurement (primary endpoint) in plain language
- Paragraph 2: Why this matters for future patients
- 2 paragraphs, MAX 80 words total

OUTPUT: 2 paragraphs, 80 words max.

EXAMPLE QUALITY:
"The study will measure a substance in your blood called NT-proBNP. High levels mean your heart is under stress. We will see if the treatment reduces this substance.

The information may help doctors treat other people with heart failure in the future."

Now write what researchers hope to learn:
""",

        "eligibility_why_asked": """You are an FDA-compliant ICF writer explaining study eligibility.

TASK: Write 1 brief paragraph (MAX 50 WORDS) on why participant was asked.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Explain eligible due to condition, requirements must be met
- 1 paragraph, MAX 50 words

OUTPUT: 1 paragraph, 50 words max.

EXAMPLE QUALITY:
"You were asked because you have heart failure and may be eligible. You need to meet certain requirements. Your study doctor will check if you meet all requirements."

Now write the eligibility explanation:
""",

        "enrollment_numbers": """You are an FDA-compliant ICF writer explaining study enrollment.

TASK: Write 1 paragraph explaining how many people will participate in the study.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- State the total number of participants expected
- Mention that people will join at multiple sites if applicable
- Use "about" for estimates
- Write exactly 1 paragraph

OUTPUT: 1 paragraph.

EXAMPLE QUALITY:
"About 450 people will take part in this study at approximately 75 study sites in the United States, Canada, and Europe. Your site will enroll about 6 people in the study."

Now write the enrollment numbers section:
""",

        "procedures_overview": """You are an FDA-compliant ICF writer explaining study procedures.

TASK: Write 2 brief paragraphs (MAX 60 WORDS TOTAL) giving a general overview of what participating involves.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- High-level only (details in other sections)
- Mention: treatment assignment, clinic visits, health monitoring
- 2 short paragraphs, MAX 60 words total

OUTPUT: 2 paragraphs, 60 words max.

EXAMPLE QUALITY:
"If you join, you will be assigned to a treatment group by chance. You will come to the clinic for regular visits so the study team can check your health.

During visits, we will do tests including blood draws and other checks. The study team will explain each test before it is done."

Now write the procedures overview:
""",

        "procedures_visits": """You are an FDA-compliant ICF writer explaining the visit schedule.

TASK: Write 2 brief paragraphs (MAX 80 WORDS) explaining visit schedule.

PROTOCOL DATA:
{relevant_protocol_data}

CRITICAL REQUIREMENTS:
- COPY visit names EXACTLY as written in data["visits"][].name - do NOT abbreviate, do NOT substitute
- If data shows "Screening Visit", write "Screening Visit" (NOT "Screening")
- If data shows "Day 1 (Randomization)", write "Day 1 (Randomization)" (NOT "Baseline")
- Brief: number of visits, when they occur, general duration
- 2 paragraphs, MAX 80 WORDS total

OUTPUT: 2 paragraphs, 80 words max.

EXAMPLE QUALITY:
"You will come to the clinic about 8 times: Screening Visit, Day 1 (Randomization), Week 4, Week 12, Week 24, Week 36, Week 48, and Safety Follow-Up about 30 days after your last dose.

Most visits take 1-2 hours. The Screening Visit may take about 2 hours because we do more tests."

Now write the visit schedule section:
""",

        "procedures_tests": """You are an FDA-compliant ICF writer explaining study tests and procedures.

TASK: Write 2 brief paragraphs (MAX 100 WORDS) explaining what tests will be done.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Blood draws: use EXACT blood_volume_ml from data, convert to tablespoons (mL ÷ 15)
- Format: "about [X] mL ([Y] tablespoons)" - ONE mention total, not per test
- Group similar tests (blood tests, vital signs, other)
- 2 paragraphs, MAX 100 words total

OUTPUT: 2 paragraphs, 100 words max.

EXAMPLE QUALITY:
"During the study, we will do tests to check your health and how the study drug is working. We will take blood samples at visits (about 25 mL or 1.5 tablespoons each time). This may cause brief discomfort or bruising.

We will check your blood pressure, heart rate, and temperature at every visit. You will also have a heart rhythm test (ECG) at some visits. These tests help us monitor your safety."

Now write the tests and procedures section:
""",

        "procedures_randomization": """You are an FDA-compliant ICF writer explaining randomization and blinding.

TASK: Write 2 brief paragraphs (MAX 80 WORDS) on how treatment assignment works.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Explain groups, chance assignment, probabilities (e.g., "1 in 3 chance")
- Explain double-blind if applicable
- 2 paragraphs, MAX 80 words

OUTPUT: 2 paragraphs, 80 words max.

EXAMPLE QUALITY (3 groups):
"You will be assigned to one of three groups by chance: 100 mg dose, 200 mg dose, or placebo. A placebo has no medicine. You have a 1 in 3 chance for any group.

Neither you nor your doctor will know your group. This is double-blind and helps ensure accurate results."

Now write the randomization and blinding section:
""",

        "procedures_study_drug": """You are an FDA-compliant ICF writer explaining how to take the study drug.

TASK: Write 1-2 paragraphs explaining how the study drug is given or taken.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Explain route of administration in simple terms:
  * "by mouth" NOT "oral"
  * "through a vein" NOT "intravenous" or "IV"
  * "under the skin" NOT "subcutaneous"
- Explain dose and frequency
- Mention duration of treatment
- Any special instructions (with food, morning/evening, etc.)
- Write 1-2 paragraphs

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"You will take your assigned pills by mouth twice every day. Take the pills with food, once in the morning and once in the evening. You will continue taking the pills for 48 weeks (about 11 months).

It is important to take your pills every day as directed. If you miss a dose or have any questions about how to take your pills, ask the study team."

Now write the study drug administration section:
""",

        "time_visits_schedule": """You are an FDA-compliant ICF writer explaining the time commitment for visits.

TASK: Write 1 brief paragraph (MAX 50 WORDS) on visit frequency and duration.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- State number of visits and typical duration
- 1 paragraph, MAX 50 words

OUTPUT: 1 paragraph, 50 words max.

EXAMPLE QUALITY:
"You will visit the clinic about 8 times during the study. Most visits take 1-2 hours. The screening visit may take longer (about 2 hours)."

Now write the visit schedule and time section:
""",

        "time_total_duration": """You are an FDA-compliant ICF writer explaining total study length.

TASK: Write 1 brief paragraph (MAX 50 WORDS) on total study length.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- State total duration in weeks/months/years
- Brief mention of phases (screening, treatment, follow-up)
- 1 paragraph, MAX 50 words

OUTPUT: 1 paragraph, 50 words max.

EXAMPLE QUALITY:
"The study lasts about 52 weeks (one year). This includes screening (up to 4 weeks), treatment (48 weeks), and a follow-up visit 30 days after your last dose."

Now write the total study duration section:
""",

        "risks_introduction": """You are an FDA-compliant ICF writer introducing the risks section.

TASK: Write exactly 2 paragraphs introducing the concept of side effects.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Define "side effects" simply
- Reassure monitoring and encourage reporting
- Do NOT list specific effects
- 2 paragraphs

OUTPUT: 2 paragraphs.

EXAMPLE QUALITY:
"Taking part in this study involves some risks. The study drug may cause side effects. A side effect is something unwanted that can happen when you take a medicine.

Tell your study doctor right away if you feel unwell or notice anything unusual during the study."

Now write the risks introduction:
""",

        "risks_very_common": """You are an FDA-compliant ICF writer listing very common side effects.

TASK: Create a simple bullet list of very common side effects (>10% frequency).

PROTOCOL DATA (filtered to very common only):
{relevant_protocol_data}

REQUIREMENTS:
- Use ONLY the plain_language version of each side effect
- Create ONE bullet point per side effect
- Keep each bullet short and clear (5-10 words max)
- DO NOT include percentages or medical terms
- DO NOT include explanations (just list the side effects)
- Format: one side effect per line, starting with "- "

OUTPUT: Bullet list (each line starts with "- ").

EXAMPLE QUALITY:
- Headache
- Dizziness
- Upset stomach or nausea

Now create the very common side effects list:
""",

        "risks_common": """You are an FDA-compliant ICF writer listing common side effects.

TASK: Create a simple bullet list of common side effects (1-10% frequency).

PROTOCOL DATA (filtered to common only):
{relevant_protocol_data}

REQUIREMENTS:
- Use ONLY the plain_language version of each side effect
- Create ONE bullet point per side effect
- Keep each bullet short and clear (5-10 words max)
- DO NOT include percentages or medical terms
- DO NOT include explanations (just list the side effects)
- Format: one side effect per line, starting with "- "

OUTPUT: Bullet list (each line starts with "- ").

EXAMPLE QUALITY:
- Low blood pressure
- Feeling tired or weak
- Fast heartbeat

Now create the common side effects list:
""",

        "risks_uncommon": """You are an FDA-compliant ICF writer listing uncommon side effects.

TASK: Create a simple bullet list of uncommon side effects (<1% frequency).

PROTOCOL DATA (filtered to uncommon only):
{relevant_protocol_data}

REQUIREMENTS:
- Use ONLY the plain_language version of each side effect
- Create ONE bullet point per side effect
- Keep each bullet short and clear (5-10 words max)
- DO NOT include percentages or medical terms
- DO NOT include explanations (just list the side effects)
- Format: one side effect per line, starting with "- "

OUTPUT: Bullet list (each line starts with "- ").

EXAMPLE QUALITY:
- Rash or skin irritation
- Diarrhea

Now create the uncommon side effects list:
""",

        "risks_unknown": """You are an FDA-compliant ICF writer explaining unknown risks.

TASK: Write 1-2 paragraphs explaining that the study drug is investigational and there may be unknown risks.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Explain that we don't know all the risks yet because it's investigational
- Promise to tell participants about new information
- Reassuring but honest tone
- Write 1-2 paragraphs

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"The study drug is investigational. This means it has not been approved by the FDA and is still being tested. There may be side effects or risks that we do not know about yet.

If we learn new information about risks during the study, we will tell you right away. We will talk to you about whether you want to stay in the study."

Now write the unknown risks section:
""",

        "risks_pregnancy": """You are an FDA-compliant ICF writer explaining pregnancy risks.

TASK: Write 2 brief paragraphs (MAX 70 WORDS) about pregnancy risks and birth control.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- State unknown effects on unborn baby, birth control required
- What to do if pregnancy occurs
- Use "birth control" NOT "contraception", "unborn baby" NOT "fetus"
- 2 paragraphs, MAX 70 words

OUTPUT: 2 paragraphs, 70 words max.

EXAMPLE QUALITY:
"We do not know if the study drug could harm an unborn baby. If you could become pregnant, you must use effective birth control during the study and for 30 days after your last dose.

If you think you might be pregnant, tell your study doctor right away. You will need to stop taking the study drug."

Now write the pregnancy risks section:
""",

        "risks_procedures": """You are an FDA-compliant ICF writer explaining risks from study procedures.

TASK: Write 1 brief paragraph (MAX 50 WORDS) on risks from study procedures.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Blood draws: mention pain, bruising, rarely infection
- Reassure problems usually minor
- 1 paragraph, MAX 50 words

OUTPUT: 1 paragraph, 50 words max.

EXAMPLE QUALITY:
"When we take blood, you may have pain or bruising where the needle goes in. Rarely, the area may get infected or you might feel dizzy. These problems are usually minor."

Now write the procedure risks section:
""",

        "benefits": """You are an FDA-compliant ICF writer explaining potential benefits.

TASK: Write 2-3 brief paragraphs (MAX 100 WORDS TOTAL) on potential benefits.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Be realistic: "may or may not benefit", no promises
- Brief: potential direct benefit + free monitoring + future knowledge
- 2-3 paragraphs, MAX 100 words total

OUTPUT: 2-3 paragraphs, 100 words max.

EXAMPLE QUALITY:
"You may or may not benefit from this study. The study drug might help your condition, but we cannot promise this.

You will receive regular medical check-ups at no cost.

What we learn may help doctors treat others with this condition in the future."

Now write the benefits section:
""",

        "alternatives": """You are an FDA-compliant ICF writer explaining alternative treatment options.

TASK: Write 1-2 paragraphs explaining alternatives to participating in this study.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- List alternatives: standard treatment, other studies, no treatment
- Encourage talking to doctor about options
- Make it clear participation is optional
- Write 1-2 paragraphs

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"You do not have to be in this study to get treatment for your condition. Instead of being in this study, you could choose to take the standard medicines your doctor already prescribes. You could also join a different research study, or choose not to receive any additional treatment at this time.

Your study doctor can discuss these options with you and help you decide what is best for you."

Now write the alternatives section:
""",

        "costs_to_participant": """You are an FDA-compliant ICF writer explaining costs.

TASK: Write 1-2 paragraphs explaining what costs the participant will and will not have to pay.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Clearly state there is no cost for study drug or study procedures
- Explain participant still pays for regular medical care
- Mention insurance coverage may vary
- Be clear and straightforward
- Write 1-2 paragraphs

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"You will not be charged for the study drug or any tests or procedures that are done only for this research study. The study sponsor will pay for these costs.

You or your insurance will still need to pay for your regular medical care and any treatment you would receive even if you were not in the study. Ask your study team if you have questions about what is covered."

Now write the costs section:
""",

        "payment_to_participant": """You are an FDA-compliant ICF writer explaining payment for participation.

TASK: Write 1-2 paragraphs about whether participants will be paid and any reimbursement for expenses.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- State clearly if payment is provided (usually not for most trials)
- Mention reimbursement for travel/parking if applicable
- Keep expectations realistic
- Write 1-2 paragraphs

OUTPUT: 1-2 paragraphs.

EXAMPLE QUALITY:
"You will not be paid for taking part in this study. However, you may receive compensation for parking and travel expenses related to your study visits. Your study team will provide you with details about expense reimbursement."

Now write the payment section:
""",

        "confidentiality": """You are an FDA-compliant ICF writer explaining how privacy will be protected.

TASK: Write 2 brief paragraphs (MAX 80 WORDS) on how records are kept private.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Who sees records (study team, sponsor, FDA), how protected (code numbers)
- Cannot guarantee complete privacy, name not in reports
- 2 paragraphs, MAX 80 words

OUTPUT: 2 paragraphs, 80 words max.

EXAMPLE QUALITY:
"We will keep your information as private as possible, but cannot guarantee complete privacy. We will use a code number instead of your name. Your records will be kept secure.

The company paying for the study and government groups like the FDA may review your records. Your name will not be used in any reports."

Now write the confidentiality section:
""",

        "compensation_injury": """You are an FDA-compliant ICF writer explaining compensation for study-related injuries.

TASK: Write 2-3 paragraphs explaining what happens if someone is injured because of the study.

PROTOCOL DATA:
{relevant_protocol_data}

REQUIREMENTS:
- Explain that medical treatment is available
- Explain to contact study doctor right away
- Mention that sponsor may cover costs (but be clear about process)
- State that signing does not waive legal rights
- Write 2-3 paragraphs

OUTPUT: 2-3 paragraphs.

EXAMPLE QUALITY:
"If you are injured as a result of being in this study, medical treatment is available. The costs of treating a study-related injury may be covered by the study sponsor. To be covered, the sponsor must be told about the injury right away.

Please contact your study doctor right away if you have any problems or think you have been injured because of the study. Ask your study team for more details about how treatment costs would be handled.

By signing this form, you are not giving up any of your legal rights."

Now write the compensation for injury section:
""",

        "voluntary_participation": """You are an FDA-compliant ICF writer explaining voluntary participation rights.

TASK: Write 2-3 paragraphs explaining that participation is voluntary and can be stopped anytime.

REQUIREMENTS:
- Emphasize that participation is completely voluntary
- Explain can refuse or quit at any time
- Reassure that refusing or quitting will not affect regular medical care
- Explain to tell study doctor if you want to stop
- Write 2-3 paragraphs
- Empowering but not pushy tone

OUTPUT: 2-3 paragraphs.

EXAMPLE QUALITY:
"Taking part in this study is completely your choice. You can choose not to join. If you do join, you can change your mind and stop at any time. You do not have to give a reason.

If you decide to stop being in the study, it will not change your regular medical care. You will still receive the care you need. Your doctor will not be upset with you if you decide to leave the study.

If you decide to leave the study, please tell your study doctor. They will talk to you about the safest way to stop taking the study drug."

Now write the voluntary participation section:
""",

        "participant_rights": """You are an FDA-compliant ICF writer explaining participant rights.

TASK: Write 2-3 paragraphs explaining the rights of research participants.

REQUIREMENTS:
- Explain rights in clear, empowering language:
  * Right to ask questions
  * Right to receive answers
  * Right to leave the study
  * Right to know about results when available
  * Right to keep getting regular medical care
- Emphasize no loss of legal rights by signing
- Empowering but not confrontational tone
- Write 2-3 paragraphs

OUTPUT: 2-3 paragraphs.

EXAMPLE QUALITY:
"As a participant in this research study, you have important rights. You have the right to ask questions about any part of the study at any time. The study team must answer your questions honestly and completely.

You have the right to decide whether to join the study, and you can change your mind and leave the study at any time. Leaving the study will not affect your regular medical care. You will still receive the treatment you need from your doctor.

Signing this form does not mean you give up any of your legal rights. You also have the right to ask about the results of the study when they become available."

Now write the participant rights section:
""",
    }

    def build_prompt(
        self,
        subsection: SubsectionDefinition,
        relevant_data: dict
    ) -> str:
        """
        Build a focused prompt for a subsection.

        Args:
            subsection: Subsection definition with requirements
            relevant_data: ONLY the protocol data needed for this subsection

        Returns:
            Focused prompt string optimized for Gemini
        """
        # Get template
        template = self.PROMPT_TEMPLATES.get(subsection.id)

        if not template:
            # For structural subsections without prompts, return empty
            return ""

        # Format with relevant data
        prompt = template.format(
            relevant_protocol_data=json.dumps(relevant_data, indent=2, default=str),
        )

        return prompt
