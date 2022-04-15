package org.openrefine.rdf.model.expr.functions;

import java.util.Properties;

import com.google.refine.expr.EvalError;
import com.google.refine.grel.ControlFunctionRegistry;
import com.google.refine.grel.Function;

/*
 * Class ToStrippedLiteral: Convert string to qualify as an RDF Literal
 * 
 *  NOTE: We don't check for a leading scheme.  We could append the baseIRI
 *      by retrieving the current baseIRI setting from the binding properties.
 */

public class ToStrippedLiteral implements Function {

    public Object call(Properties bindings, Object[] args) {
        //String strBaseIRI = bindings.get("baseIRI").toString();

        if (args.length != 1) {
            return new EvalError(ControlFunctionRegistry.getFunctionName(this) + " expects a single string!");
        }
        if (args[0] == null) {
            return null;
        }
        String strConvert = args[0].toString();
        if ( strConvert.isEmpty() ) {
            return new EvalError("empty string");
        }

        strConvert = strConvert.replaceAll("[\uC2A0\\p{C}\\p{Z}]+", "").strip();

        return strConvert;
    }

    @Override
    public String getDescription() {
            return "toStrippedLiteral() is intended to minimally prepare a literal.\n" +
                    "    1. Replace non-breaking space characters with normal spaces.\n" +
                    "    2. Replace horitontal whitespace with normal spaces.\n" +
                    "    3. Strip the ends of the string removing whitespace.";
    }

    @Override
    public String getParams() {
        return "String s";
    }

    @Override
    public String getReturns() {
        return "String";
    }
}