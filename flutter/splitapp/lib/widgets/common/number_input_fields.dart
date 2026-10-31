import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class IntInputField extends StatefulWidget {
  final int value;
  final ValueChanged<int> onCommit;
  final int min;
  final int max;
  final bool borderless;
  final double? width;

  const IntInputField({
    super.key,
    required this.value,
    required this.onCommit,
    this.min = 0,
    this.max = 1000000,
    this.borderless = false,
    this.width,
  });

  @override
  State<IntInputField> createState() => _IntInputFieldState();
}

class _IntInputFieldState extends State<IntInputField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  int _lastCommitted = 0;

  @override
  void initState() {
    super.initState();
    _lastCommitted = widget.value;
    _controller = TextEditingController(text: widget.value.toString());
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    } else {
      _controller.text = _lastCommitted.toString();
    }
  }

  @override
  void didUpdateWidget(covariant IntInputField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _lastCommitted && !_focusNode.hasFocus) {
      _lastCommitted = widget.value;
      _controller.text = widget.value.toString();
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String text) {
    final parsed = int.tryParse(text.trim());
    if (parsed != null && parsed >= widget.min && parsed <= widget.max) {
      _lastCommitted = parsed;
      widget.onCommit(parsed);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget field = TextField(
      controller: _controller,
      focusNode: _focusNode,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.right,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        fontFamily: 'monospace',
        color: AppColors.textPrimary,
      ),
      decoration: InputDecoration(
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        filled: !widget.borderless,
        fillColor:
            widget.borderless ? Colors.transparent : AppColors.surfaceElevated,
        border: widget.borderless
            ? InputBorder.none
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
        enabledBorder: widget.borderless
            ? InputBorder.none
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
        focusedBorder: widget.borderless
            ? OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              )
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
      ),
      onChanged: _onChanged,
    );

    if (widget.width != null) {
      return SizedBox(width: widget.width, child: field);
    }
    return field;
  }
}

class FloatInputField extends StatefulWidget {
  final double value;
  final ValueChanged<double> onCommit;
  final double min;
  final double max;
  final int decimals;
  final String? suffix;
  final double? width;

  const FloatInputField({
    super.key,
    required this.value,
    required this.onCommit,
    this.min = 0,
    this.max = 1000000000,
    this.decimals = 2,
    this.suffix,
    this.width,
  });

  @override
  State<FloatInputField> createState() => _FloatInputFieldState();
}

class _FloatInputFieldState extends State<FloatInputField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  double _lastCommitted = 0;

  @override
  void initState() {
    super.initState();
    _lastCommitted = widget.value;
    _controller = TextEditingController(
      text: widget.value.toStringAsFixed(widget.decimals),
    );
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    } else {
      _controller.text = _lastCommitted.toStringAsFixed(widget.decimals);
    }
  }

  @override
  void didUpdateWidget(covariant FloatInputField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _lastCommitted && !_focusNode.hasFocus) {
      _lastCommitted = widget.value;
      _controller.text = widget.value.toStringAsFixed(widget.decimals);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String text) {
    final parsed = double.tryParse(text.trim());
    if (parsed != null && parsed >= widget.min && parsed <= widget.max) {
      _lastCommitted = parsed;
      widget.onCommit(parsed);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget field = TextField(
      controller: _controller,
      focusNode: _focusNode,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      textAlign: TextAlign.right,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        fontFamily: 'monospace',
        color: AppColors.textPrimary,
      ),
      decoration: InputDecoration(
        isDense: true,
        suffixText: widget.suffix,
        suffixStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        filled: true,
        fillColor: AppColors.surfaceElevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
      onChanged: _onChanged,
    );

    if (widget.width != null) {
      return SizedBox(width: widget.width, child: field);
    }
    return field;
  }
}
