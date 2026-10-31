class VisionModelChoice {
  final String id;
  final String name;
  final String badge;
  const VisionModelChoice({
    required this.id,
    required this.name,
    required this.badge,
  });
}

const List<VisionModelChoice> availableVisionModels = [
  VisionModelChoice(
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    badge: 'Recommended · High Accuracy',
  ),
  VisionModelChoice(
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'Google DiffusionGemma 26B',
    badge: 'Experimental',
  ),
  VisionModelChoice(
    id: 'nvidia/nemotron-parse-2.0',
    name: 'Nemotron Parse 2.0',
    badge: 'Fast OCR',
  ),
];

class VisionPromptChoice {
  final String id;
  final String label;
  final String prompt;
  const VisionPromptChoice({
    required this.id,
    required this.label,
    required this.prompt,
  });
}

const List<VisionPromptChoice> presetVisionPrompts = [
  VisionPromptChoice(
    id: 'detailed',
    label: 'Exact Text & Item Breakdown',
    prompt:
        'Transcribe every line of text from the receipt exactly as printed (Exact Raw Text First). Then extract all purchased products with exact Name, Quantity, Unit Price, and Total Amount, plus subtotal, taxes, and grand total.',
  ),
  VisionPromptChoice(
    id: 'items_only',
    label: 'Extract Items & Prices Only',
    prompt:
        'Extract every product with its Name, Quantity, Unit Price, and Total Amount. Verify mathematical consistency (quantity * unit_price = total).',
  ),
  VisionPromptChoice(
    id: 'quick',
    label: 'Quick Description',
    prompt:
        'Describe what is in this image in detail. Mention all visible text, numbers, and key elements.',
  ),
];

class DialogPerson {
  final String id;
  final String name;
  final String? photo;
  final bool isNew;

  const DialogPerson({
    required this.id,
    required this.name,
    this.photo,
    this.isNew = false,
  });

  DialogPerson copyWith({
    String? id,
    String? name,
    String? photo,
    bool? isNew,
  }) {
    return DialogPerson(
      id: id ?? this.id,
      name: name ?? this.name,
      photo: photo ?? this.photo,
      isNew: isNew ?? this.isNew,
    );
  }
}

class EditableDetectedItem {
  final String id;
  final String name;
  final int quantity;
  final int unitPricePaise;
  final int totalPaise;
  final List<String> assignedParticipantIds;

  const EditableDetectedItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPricePaise,
    required this.totalPaise,
    this.assignedParticipantIds = const [],
  });

  EditableDetectedItem copyWith({
    String? id,
    String? name,
    int? quantity,
    int? unitPricePaise,
    int? totalPaise,
    List<String>? assignedParticipantIds,
  }) {
    return EditableDetectedItem(
      id: id ?? this.id,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unitPricePaise: unitPricePaise ?? this.unitPricePaise,
      totalPaise: totalPaise ?? this.totalPaise,
      assignedParticipantIds:
          assignedParticipantIds ?? this.assignedParticipantIds,
    );
  }
}
